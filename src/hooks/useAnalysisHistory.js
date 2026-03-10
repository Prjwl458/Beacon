import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logHookState, logError } from '../utils/debugLogger';

// Maximum number of history entries to maintain (memory efficiency)
const MAX_HISTORY_SIZE = 100;
const STORAGE_KEY = '@phishit_analysis_history';

/**
 * Custom hook for managing analysis history with AsyncStorage persistence
 * 
 * Stores all analyzed messages locally with duplicate prevention
 * to save on rate-limit tokens.
 * 
 * @returns {Object} Hook interface
 * @property {Object[]} history - Array of analysis history entries
 * @property {Function} addToHistory - Add new analysis result
 * @property {Function} getHistory - Get current history
 * @property {Function} clearHistory - Clear all history
 * @property {Function} isDuplicate - Check if message is duplicate
 * @property {number} count - Number of history entries
 * @property {boolean} isLoaded - Whether history has been loaded from storage
 */
export const useAnalysisHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from AsyncStorage
  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      } else {
        setHistory([]);
      }
    } catch (err) {
      logError('useAnalysisHistory.loadHistory', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Load history from AsyncStorage on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Expose refreshHistory function for manual refresh
  const refreshHistory = useCallback(async () => {
    await loadHistory();
  }, [loadHistory]);

  // Save to AsyncStorage whenever history changes
  const saveToStorage = useCallback(async (newHistory) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (err) {
      logError('useAnalysisHistory.saveToStorage', err);
    }
  }, []);

  /**
   * Check if a message (text + sender) is already in history
   * Uses memoization for performance
   * @param {string} text - Message text
   * @param {string} senderId - Sender identifier
   * @returns {boolean} True if duplicate exists
   */
  const isDuplicate = useCallback((text, senderId) => {
    return history.some(
      entry => entry.originalText === text && entry.senderId === senderId
    );
  }, [history]);

  /**
   * Add a new analysis result to history
   * Prevents duplicates and manages memory with MAX_HISTORY_SIZE
   * ALWAYS saves to AsyncStorage, even on failure
   * 
   * @param {Object} analysisResult - Result from useSmsAnalyzer
   * @param {string} originalText - Original SMS text
   * @param {string} senderId - Sender identifier
   * @returns {boolean} True if added successfully, false if duplicate
   */
  const addToHistory = useCallback((analysisResult, originalText, senderId) => {
    // Check for duplicate
    const isDup = history.some(
      entry => entry.originalText === originalText && entry.senderId === senderId
    );

    if (isDup) {
      logHookState('useAnalysisHistory', 'duplicate', { text: originalText, senderId });
      return false;
    }

    try {
      // Create history entry - explicitly extract latency from both sources
      const newEntry = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        originalText,
        senderId,
        // If analysis failed, mark as failed
        riskScore: analysisResult?.riskScore ?? null,
        isPhishing: analysisResult?.isPhishing ?? false,
        status: analysisResult?.riskScore !== null ? 'success' : 'failed',
        error: analysisResult?.error || null,
        // Telemetry data - explicitly extract from both sources
        latency_ms: analysisResult?.latency_ms ?? analysisResult?.intelligence?.latency_ms ?? null,
        version: analysisResult?.version ?? null,
        // Extract data if available
        upiIds: analysisResult?.upiId ? [analysisResult.upiId] : [],
        bankNames: analysisResult?.bankName ? [analysisResult.bankName] : [],
        details: analysisResult?.details ?? null,
        verdict: analysisResult?.verdict ?? null,
        scamType: analysisResult?.scamType ?? null,
        extracted: analysisResult?.extracted ?? { links: [], upis: [], accounts: [] },
        // Full intelligence data if available
        intelligence: analysisResult?.intelligence ?? null,
      };

      setHistory(prevHistory => {
        // FIFO: Remove oldest if at max capacity
        const updatedHistory = [...prevHistory, newEntry];
        const trimmedHistory = updatedHistory.length > MAX_HISTORY_SIZE 
          ? updatedHistory.slice(-MAX_HISTORY_SIZE) 
          : updatedHistory;
        
        // Save to AsyncStorage
        saveToStorage(trimmedHistory);
        
        return trimmedHistory;
      });

      logHookState('useAnalysisHistory', 'addToHistory', { 
        id: newEntry.id, 
        riskScore: newEntry.riskScore,
        status: newEntry.status 
      });
      return true;
      
    } catch (err) {
      logError('useAnalysisHistory.addToHistory', err);
      return false;
    }
  }, [history, saveToStorage]);

  /**
   * Get current history array (sorted newest-first)
   * @returns {Object[]} Current history entries sorted by timestamp descending
   */
  const getHistory = useCallback(() => {
    // Return history sorted by timestamp (newest first)
    return [...history].sort((a, b) => b.timestamp - a.timestamp);
  }, [history]);

  /**
   * Clear all history (both state and storage)
   */
  const clearHistory = useCallback(async () => {
    setHistory([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      logError('useAnalysisHistory.clearHistory', err);
    }
    logHookState('useAnalysisHistory', 'clearHistory', 'all');
  }, []);

  /**
   * Get history count
   */
  const count = useMemo(() => history.length, [history]);

  return {
    history,
    addToHistory,
    getHistory,
    clearHistory,
    refreshHistory,
    isDuplicate,
    count,
    isLoaded,
  };
};

export default useAnalysisHistory;
