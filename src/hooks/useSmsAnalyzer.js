import { useState, useCallback, useEffect, useRef } from 'react';
import { analyzeMessage, validateConnection, isPulseValid, wakeUpServer } from '../services/api';
import { useServer, SERVER_STATES } from '../context/ServerContext';
import { validateSessionId, generateSenderId, generateSessionId } from '../utils/session';
import { logAnalysisResult, logError, logHookState } from '../utils/debugLogger';
import { useAnalysisHistory } from './useAnalysisHistory';

// Initial state for the reducer
const INITIAL_STATE = {
  data: null,
  loading: false,
  error: null,
  lastPulse: null,
};

/**
 * Custom hook for analyzing SMS messages for phishing detection
 * Uses reducer pattern for robust state management
 * 
 * @returns {Object} Hook interface
 */
export const useSmsAnalyzer = () => {
  // Reducer-style state
  const [state, setState] = useState(INITIAL_STATE);
  
  // AbortController ref for request cancellation
  const abortControllerRef = useRef(null);
  
  // Access server context to check status
  const { isServerReady, serverStatus, sessionId: contextSessionId } = useServer();
  
  // Access analysis history
  const { addToHistory, isDuplicate } = useAnalysisHistory();
  
  // Current session ID - derive from ServerContext (persists across navigation)
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSenderId] = useState(() => generateSenderId());

  // Sync sessionId from context to local state
  useEffect(() => {
    if (contextSessionId && validateSessionId(contextSessionId)) {
      setCurrentSessionId(contextSessionId);
    } else if (!currentSessionId) {
      // Fallback: generate if context not ready
      setCurrentSessionId(generateSessionId());
    }
  }, [contextSessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Process a single SMS message for phishing analysis
   * @param {string} smsBody - The SMS message text
   * @returns {Promise<Object>} Analysis result or error
   */
  const processMessage = useCallback(async (smsBody) => {
    // Reset state
    setState({ data: null, loading: true, error: null, lastPulse: Date.now() });
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      // Reliability Check: Check if pulse is valid (within 60 seconds)
      if (!isPulseValid()) {
        setState(prev => ({ ...prev, loading: true, error: 'Waking up server...' }));

        // Trigger wake-up attempt
        const woke = await wakeUpServer(signal);
        if (!woke) {
          throw new Error('Failed to wake up server');
        }
      }
      
      // Duplicate Prevention: Check if message already analyzed
      const senderId = currentSenderId;
      if (isDuplicate(smsBody, senderId)) {
        const errorMessage = 'Duplicate message - Already analyzed in this session';
        setState({ data: null, loading: false, error: errorMessage, lastPulse: Date.now() });

        // Log failed attempt to history
        addToHistory(
          { riskScore: null, error: errorMessage, isPhishing: false },
          smsBody,
          currentSenderId
        );

        logHookState('useSmsAnalyzer', 'duplicate', { text: smsBody, senderId });
        return {
          success: false,
          error: errorMessage,
          riskScore: null,
          isDuplicate: true,
        };
      }

      logHookState('useSmsAnalyzer', 'loading', true);

      // Call the API service with AbortController signal
      const apiResult = await analyzeMessage(smsBody, signal);
      
      // Check if response was successful
      if (!apiResult.success) {
        throw new Error(apiResult.data?.detail || 'Analysis failed');
      }
      
      // Transform API response with SAFE MAPPING (optional chaining)
      const result = transformAnalysisResult(apiResult.data);

      // Add to history
      addToHistory(result, smsBody, currentSenderId);
      
      // Update state with success
      setState({ data: result, loading: false, error: null, lastPulse: Date.now() });
      logHookState('useSmsAnalyzer', 'loading', false);
      
      return {
        success: true,
        ...result,
      };
      
    } catch (err) {
      // Handle abort
      if (err.name === 'AbortError' || err.message === 'Request cancelled') {
        setState({ data: null, loading: false, error: 'Request cancelled', lastPulse: Date.now() });
        return { success: false, error: 'Request cancelled', riskScore: null };
      }

      const errorMessage = err.message || 'Analysis failed - Unknown error';
      
      // Log failed attempt to history (even on error, we want to record the attempt)
      addToHistory(
        { riskScore: null, error: errorMessage, isPhishing: false },
        smsBody,
        currentSenderId
      );
      
      setState({ data: null, loading: false, error: errorMessage, lastPulse: Date.now() });
      logHookState('useSmsAnalyzer', 'loading', false);
      logError('useSmsAnalyzer.processMessage', err);
      
      return {
        success: false,
        error: errorMessage,
        riskScore: null,
      };
    }
  }, [currentSenderId]);

  /**
   * Reset all hook states to initial values
   */
  const resetState = useCallback(() => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(INITIAL_STATE);
  }, []);

  /**
   * Cancel ongoing request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({ ...prev, loading: false, error: 'Request cancelled by user' }));
    }
  }, []);

  /**
   * Transform raw API response to standardized format
   * Uses SAFE MAPPING with optional chaining to prevent crashes
   * @param {Object} apiResponse - Raw response from backend
   * @returns {Object} Transformed result
   */
  const transformAnalysisResult = (apiResponse) => {
    // Extract intelligence with safe optional chaining
    const intelligence = apiResponse?.intelligence || {};
    
    // Get riskScore - safe extraction
    const riskScore = intelligence?.riskScore ?? intelligence?.risk_score ?? intelligence?.riskScore ?? null;
    
    // Derive isPhishing: true if riskScore > 60
    const isPhishing = (riskScore !== null && riskScore > 60) || intelligence?.isPhishing || intelligence?.is_phishing || false;
    
    return {
      // Status from response
      status: apiResponse?.status || 'unknown',
      
      // Extract verdict from reply
      verdict: apiResponse?.reply || null,
      reply: apiResponse?.reply || null,
      
      // Safe extraction from intelligence
      riskScore: riskScore,
      isPhishing: isPhishing,
      scamType: intelligence?.scamType || null,
      agentNotes: intelligence?.agentNotes || null,
      
      // Safe extraction of extracted data
      extracted: {
        links: intelligence?.phishingLinks ?? intelligence?.links ?? [],
        upis: intelligence?.upiIds ?? intelligence?.upis ?? [],
        accounts: intelligence?.bankAccounts ?? intelligence?.accounts ?? [],
      },
      
      // Legacy fields for compatibility
      upiId: intelligence?.upiIds?.[0] ?? intelligence?.upiId ?? intelligence?.upi_id ?? null,
      bankName: intelligence?.bankAccounts?.[0] ?? intelligence?.bankName ?? intelligence?.bank_name ?? null,
      details: intelligence?.details || null,
      
      // Additional intelligence fields
      indicators: intelligence?.indicators || [],
      category: intelligence?.category || null,
      
      // Keep raw for debugging
      rawResponse: apiResponse,
    };
  };

  return {
    // State
    isAnalyzing: state.loading,
    analysisResult: state.data,
    error: state.error,
    lastPulse: state.lastPulse,
    
    // Server state
    isServerReady,
    serverStatus,
    
    // Actions
    processMessage,
    resetState,
    cancelRequest,
  };
};

export default useSmsAnalyzer;
