import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../styles/beaconTheme';
import { wp, hp, fp } from '../utils/responsive';

/**
 * Toast Component
 * 
 * A brief feedback message that appears and auto-dismisses.
 * Used for "Copied to Clipboard" feedback.
 * 
 * Props:
 * - message: string - The toast message
 * - visible: boolean - Whether toast is visible
 * - duration: number - How long to show (default: 2000ms)
 * - type: 'success' | 'error' | 'info' - Toast type (determines color)
 */
export default function Toast({ 
  message = 'Copied to Clipboard', 
  visible = false, 
  duration = 2000,
  type = 'success'
}) {
  const [opacity] = useState(new Animated.Value(0));
  
  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Fade out after duration
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, opacity]);
  
  if (!visible) return null;
  
  // Get background color based on type
  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return colors.danger;
      case 'info':
        return colors.primary;
      default:
        return colors.success;
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: getBackgroundColor(), opacity }
      ]}
      pointerEvents="none"
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: hp(12),
    left: wp(4),
    right: wp(4),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  message: {
    color: colors.textPrimary,
    fontSize: fp(14),
    fontWeight: typography.fontWeight.medium,
  },
});
