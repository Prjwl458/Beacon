/**
 * Session utilities for managing chat sessions
 */

/**
 * Validate session ID is not null, undefined, or empty
 * @param {string} sessionId - Session identifier to validate
 * @throws {Error} If sessionId is null, undefined, or empty
 */
export const validateSessionId = (sessionId) => {
  if (sessionId === null || sessionId === undefined || sessionId.trim() === '') {
    throw new Error('sessionId cannot be null, undefined, or empty');
  }
};

/**
 * Generate a unique session ID using timestamp and random component
 * @returns {string} Unique session identifier
 */
export const generateSessionId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${randomPart}${randomPart2}`;
};

/**
 * Generate a unique sender ID for the current user
 * @returns {string} Unique sender identifier
 */
export const generateSenderId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `user_${timestamp}_${randomPart}`;
};

/**
 * Create a standardized message payload for the API
 * @param {string} sessionId - The session identifier
 * @param {string} text - Message text content
 * @param {string} senderId - Sender identifier
 * @param {string} channel - Communication channel (default: "sms")
 * @returns {Object} Formatted payload for analyzeMessage API
 */
export const createMessagePayload = (sessionId, text, senderId, channel = 'sms') => {
  // Validate sessionId before creating payload
  validateSessionId(sessionId);
  
  return {
    sessionId,
    message: {
      text,
      senderId,
      type: 'text',
    },
    metadata: {
      channel,
    },
  };
};

export default {
  generateSessionId,
  generateSenderId,
  createMessagePayload,
  validateSessionId,
};
