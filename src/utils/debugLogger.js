/**
 * Debug Logging Utility for Phish-It
 * Provides structured logging for server status and analysis flow
 */

// Prefix for all debug logs
const DEBUG_PREFIX = '[Phish-It]';

/**
 * Get current timestamp in ISO format
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => new Date().toISOString();

/**
 * Log server status transition
 * @param {string} oldStatus - Previous server status
 * @param {string} newStatus - New server status
 */
export const logServerStatusChange = (oldStatus, newStatus) => {
  console.log(
    `${DEBUG_PREFIX} [ServerStatus] ${getTimestamp()} | ${oldStatus} → ${newStatus}`
  );
};

/**
 * Log analysis request with full payload
 * @param {string} sessionId - Session identifier
 * @param {Object} payload - Full JSON payload sent to backend
 */
export const logAnalysisRequest = (sessionId, payload) => {
  console.log(
    `${DEBUG_PREFIX} [API Request] ${getTimestamp()} | Session: ${sessionId}`
  );
  console.log(
    `${DEBUG_PREFIX} [API Request] Full Payload: ${JSON.stringify(payload, null, 2)}`
  );
};

/**
 * Log analysis result from backend
 * @param {Object} result - Analysis result from API
 * @param {number} result.riskScore - Risk score (0-100)
 * @param {boolean} result.isPhishing - Whether message is phishing
 * @param {string|null} result.upiId - Detected UPI ID
 * @param {string|null} result.bankName - Detected bank name
 */
export const logAnalysisResult = (result) => {
  console.log(
    `${DEBUG_PREFIX} [API Response] ${getTimestamp()} | Risk Score: ${result.riskScore}, Phishing: ${result.isPhishing}`
  );
  if (result.upiId) {
    console.log(`${DEBUG_PREFIX} [API Response] UPI ID Detected: ${result.upiId}`);
  }
  if (result.bankName) {
    console.log(`${DEBUG_PREFIX} [API Response] Bank Name Detected: ${result.bankName}`);
  }
  if (result.details) {
    console.log(`${DEBUG_PREFIX} [API Response] Details: ${result.details}`);
  }
};

/**
 * Log error with context
 * @param {string} context - Where the error occurred
 * @param {Error|string} error - Error object or message
 */
export const logError = (context, error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(
    `${DEBUG_PREFIX} [ERROR] ${getTimestamp()} | Context: ${context} | Message: ${errorMessage}`
  );
};

/**
 * Log SMS loader events
 * @param {string} event - Event type (permission_check, fetch, filter)
 * @param {Object} data - Event data
 */
export const logSmsLoader = (event, data) => {
  console.log(
    `${DEBUG_PREFIX} [SMS Loader] ${getTimestamp()} | Event: ${event}`
  );
  if (data) {
    console.log(
      `${DEBUG_PREFIX} [SMS Loader] Data: ${JSON.stringify(data, null, 2)}`
    );
  }
};

/**
 * Log hook state changes
 * @param {string} hookName - Name of the hook
 * @param {string} state - State being changed
 * @param {any} value - New value
 */
export const logHookState = (hookName, state, value) => {
  console.log(
    `${DEBUG_PREFIX} [Hook:${hookName}] ${getTimestamp()} | ${state}: ${JSON.stringify(value)}`
  );
};

export default {
  logServerStatusChange,
  logAnalysisRequest,
  logAnalysisResult,
  logError,
  logSmsLoader,
  logHookState,
};
