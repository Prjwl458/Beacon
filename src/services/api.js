import axios from 'axios';

// Configuration constants
const BASE_URL = 'https://hackthoan-honeypot-agentic.onrender.com';
const API_KEY = 'prajwal_hackathon_key_2310';
const TIMEOUT_MS = 20000; // 20 seconds - strict timeout
const WAKEUP_TIMEOUT_MS = 120000; // 120 seconds (2 minutes) for Render cold start
const RATE_LIMIT_COOLDOWN_MS = 5000; // 5 seconds

// Create Axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

// Create separate axios instance for wake-up with longer timeout
const wakeUpClient = axios.create({
  baseURL: BASE_URL,
  timeout: WAKEUP_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

// Track last successful pulse timestamp
let lastPulseTimestamp = null;
const PULSE_VALIDITY_MS = 60000; // 60 seconds

/**
 * Check if the server pulse is still valid (within 60 seconds)
 * @returns {boolean}
 */
export const isPulseValid = () => {
  if (!lastPulseTimestamp) return false;
  return (Date.now() - lastPulseTimestamp) < PULSE_VALIDITY_MS;
};

/**
 * Validate connection to the Render server.
 * Performs a GET request to confirm server is awake.
 * Uses AbortController for request cancellation.
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<boolean>} True if server responds, false otherwise
 */
export const validateConnection = async (signal = null) => {
  try {
    const response = await wakeUpClient.get('/', { signal });
    lastPulseTimestamp = Date.now();
    return true;
  } catch (error) {
    // Handle abort
    if (axios.isCancel(error)) {
      return false;
    }

    const statusCode = error.response?.status || 'NO RESPONSE';
    return false;
  }
};

/**
 * Wake up the Render server by making a GET request to the base URL.
 * This triggers the cold start if the server is in idle state.
 * Uses longer timeout (120s) to account for Render's cold start time.
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<boolean>} True if wake-up successful, false otherwise
 */
export const wakeUpServer = async (signal = null) => {
  const wakeUpUrl = `${BASE_URL}/`;

  try {
    const response = await wakeUpClient.get('/', { signal });
    lastPulseTimestamp = Date.now();
    return true;
  } catch (error) {
    // Handle abort
    if (axios.isCancel(error)) {
      return false;
    }

    if (error.response?.status === 429) {
      // Rate limited - wait for cooldown and retry
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_COOLDOWN_MS));
      try {
        const response = await wakeUpClient.get('/', { signal });
        lastPulseTimestamp = Date.now();
        return true;
      } catch (retryError) {
        console.error('[API] Retry after rate limit failed:', retryError.message);
        return false;
      }
    }

    // Log detailed error for debugging
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Wake-up timeout (120s): Server took too long to respond - still spinning up');
      // Even if it timed out, the server might still be waking up - return true to let it continue
      lastPulseTimestamp = Date.now();
      return true;
    } else if (error.response?.status === 403) {
      console.error('[API] Auth Error (403): Invalid API key');
    } else if (error.response?.status === 500) {
      console.error('[API] Server Error (500): Internal server error');
    } else if (!error.response) {
      console.error('[API] Network error:', error.message);
      console.error('[API] Check if the server URL is accessible:', BASE_URL);
    } else {
      console.error('[API] Wake-up error:', error.message);
      console.error('[API] Error response:', error.response?.data);
    }

    return false;
  }
};

/**
 * Analyze a message for phishing detection.
 * Uses the /message endpoint with HoneypotRequest schema.
 * Implements AbortController for request cancellation.
 * Implements Zero-Null Policy for Backend Data Contract v1.2.0
 *
 * @param {Object} params - Analysis parameters
 * @param {string} params.sessionId - Session identifier
 * @param {Object} params.message - Message object with text, senderId, type
 * @param {Object} params.metadata - Metadata with channel
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<Object>} Analysis result from backend with Zero-Null Policy
 */
export const analyzeMessage = async (params, signal = null) => {
  // Generate Unix timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Backend v1.2.0 payload structure
  const payload = {
    sessionId: params?.sessionId || `beacon_${Date.now()}`,
    message: {
      sender: params?.message?.senderId || "user",
      text: params?.message?.text || "",
      timestamp: timestamp,
    },
    metadata: {
      channel: params?.metadata?.channel || "sms",
      language: "English",
      locale: "IN",
    },
  };
  
  const fullUrl = `${BASE_URL}/message`;

  try {
    const response = await apiClient.post('/message', payload, { signal });

    // Zero-Null Policy: Backend Data Contract v1.2.0
    // Sanitize response to ensure no null values
    const responseData = response.data || {};

    // Extract data from nested intelligence object if present
    const intelligence = responseData.intelligence || responseData;

    // Map backend response to frontend expected format
    const riskScore = intelligence.riskScore ?? responseData.riskScore ?? responseData.risk_score ?? 0;
    const agentNotes = intelligence.agentNotes ?? responseData.agentNotes ?? responseData.reply ?? 'Analysis complete';
    const isPhishing = intelligence.isPhishing ?? responseData.isPhishing ?? false;

    return {
      isPhishing: isPhishing,
      riskScore: riskScore,
      agentNotes: agentNotes,
      latency_ms: intelligence.latency_ms ?? responseData.latency_ms ?? 0,
      version: responseData.version ?? '1.0.0',
      success: true,
      status: response.status,
      // Include full intelligence data for advanced features
      intelligence: intelligence,
    };
  } catch (error) {
    // Handle abort
    if (axios.isCancel(error)) {
      throw new Error('Request cancelled');
    }

    // Log status code for debugging
    const statusCode = error.response?.status || 'NO RESPONSE';
    const errorData = error.response?.data;

    // Handle specific error types
    if (statusCode === 'ECONNABORTED' || error.code === 'ECONNABORTED') {
      throw new Error('Error: Request timed out after 20 seconds');
    }

    if (statusCode === 403) {
      throw new Error('Error 403: Authentication failed - Invalid API key');
    }

    if (statusCode === 500) {
      throw new Error('Error 500: Server internal error');
    }

    // Handle 422 Pydantic Validation Error
    if (statusCode === 422) {
      const detail = errorData?.detail || 'Unknown validation error';
      throw new Error(`Error 422 - Validation Error: ${JSON.stringify(detail)}`);
    }

    if (error.response?.status === 429) {
      // Rate limited - wait for cooldown and retry
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_COOLDOWN_MS));
      try {
        const response = await apiClient.post('/message', payload, { signal });
        return { success: true, data: response.data, status: response.status };
      } catch (retryError) {
        throw new Error(`Analysis failed after rate limit retry: ${retryError.message}`);
      }
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out after 20 seconds');
    }

    // Handle network errors
    if (!error.response) {
      throw new Error(`Network error: ${error.message}`);
    }

    throw new Error(`Error ${statusCode}: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Check if the server is currently reachable.
 * @returns {Promise<boolean>} True if server is reachable
 */
export const checkServerStatus = async () => {
  try {
    await apiClient.get('/');
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Report a high-risk threat to the backend for tracking.
 * @param {Object} threatData - The threat data to report
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} Report result from backend
 */
export const reportThreat = async (threatData, signal = null) => {
  try {
    const payload = {
      ...threatData,
      timestamp: Date.now(),
    };
    const response = await apiClient.post('/report', payload, { signal });
    return response.data;
  } catch (error) {
    // Handle abort
    if (axios.isCancel(error)) {
      throw new Error('Request cancelled');
    }
    
    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      throw new Error('Report request timed out after 20 seconds');
    }
    
    // Handle network errors
    if (!error.response) {
      throw new Error(`Network error: ${error.message}`);
    }
    
    throw new Error(`Report failed: ${error.response?.data?.detail || error.message}`);
  }
};

export default apiClient;
