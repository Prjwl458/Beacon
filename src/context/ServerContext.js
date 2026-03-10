import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { wakeUpServer, checkServerStatus } from '../services/api';
import { generateSessionId } from '../utils/session';

// Server status constants
export const SERVER_STATES = {
  OFFLINE: 'OFFLINE',
  WAKING_UP: 'WAKING_UP',
  LIVE: 'LIVE',
};

// Create the context
const ServerContext = createContext(null);

/**
 * ServerContext Provider Component
 * Manages the lifecycle of the Render server connection
 * and exposes server status to all child components.
 */
export const ServerProvider = ({ children }) => {
  const [serverStatus, setServerStatus] = useState(SERVER_STATES.OFFLINE);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const isInitialized = useRef(false);

  // Generate sessionId once on mount
  useEffect(() => {
    if (!isInitialized.current) {
      setSessionId(generateSessionId());
      isInitialized.current = true;
    }
  }, []);

  // Auto-check server status on mount
  useEffect(() => {
    const checkServerOnMount = async () => {
      try {
        const isReachable = await checkServerStatus();
        if (isReachable) {
          setServerStatus(SERVER_STATES.LIVE);
          setLastChecked(new Date());
        }
      } catch (err) {
        // Silently fail on initial check
      }
    };

    checkServerOnMount();
  }, []);

  // Periodic status check - every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const isReachable = await checkServerStatus();
        if (isReachable) {
          setServerStatus(SERVER_STATES.LIVE);
          setLastChecked(new Date());
        } else {
          setServerStatus(SERVER_STATES.OFFLINE);
        }
      } catch (err) {
        setServerStatus(SERVER_STATES.OFFLINE);
      }
    }, 30000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  /**
   * Attempt to wake up the Render server.
   * Updates status to WAKING_UP during the process.
   * @returns {Promise<boolean>} True if server is now live
   */
  const wakeUp = useCallback(async () => {
    if (serverStatus === SERVER_STATES.WAKING_UP) {
      return false; // Already waking up
    }

    setServerStatus(SERVER_STATES.WAKING_UP);
    setError(null);

    try {
      const success = await wakeUpServer();
      if (success) {
        setServerStatus(SERVER_STATES.LIVE);
        setLastChecked(new Date());
        return true;
      } else {
        setError('Failed to wake up server');
        setServerStatus(SERVER_STATES.OFFLINE);
        return false;
      }
    } catch (err) {
      setError(err.message);
      setServerStatus(SERVER_STATES.OFFLINE);
      return false;
    }
  }, [serverStatus]);

  /**
   * Check current server status without waking it up
   * @returns {Promise<boolean>} True if server is reachable
   */
  const checkStatus = useCallback(async () => {
    try {
      const isReachable = await checkServerStatus();
      if (isReachable) {
        setServerStatus(SERVER_STATES.LIVE);
        setLastChecked(new Date());
      } else {
        setServerStatus(SERVER_STATES.OFFLINE);
      }
      return isReachable;
    } catch (err) {
      setServerStatus(SERVER_STATES.OFFLINE);
      return false;
    }
  }, []);

  /**
   * Reset server status to OFFLINE
   */
  const resetServer = useCallback(() => {
    setServerStatus(SERVER_STATES.OFFLINE);
    setError(null);
    setLastChecked(null);
  }, []);

  /**
   * Check if server is ready for API calls
   */
  const isServerReady = serverStatus === SERVER_STATES.LIVE;

  /**
   * Check if server is currently transitioning
   */
  const isTransitioning = serverStatus === SERVER_STATES.WAKING_UP;

  const value = {
    serverStatus,
    error,
    lastChecked,
    isServerReady,
    isTransitioning,
    wakeUp,
    checkStatus,
    resetServer,
    sessionId,
  };

  return (
    <ServerContext.Provider value={value}>
      {children}
    </ServerContext.Provider>
  );
};

/**
 * Custom hook to access server context
 * @returns {Object} Server context value
 * @throws {Error} If used outside ServerProvider
 */
export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
};

export default ServerContext;
