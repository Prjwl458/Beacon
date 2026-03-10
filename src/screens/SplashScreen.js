import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { wp, hp, fp } from '../utils/responsive';
import { colors } from '../styles/beaconTheme';

/**
 * Premium Splash Screen – Beacon App
 * Clean, minimal, professional loading experience
 */
export default function SplashScreen() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [barWidth] = useState(new Animated.Value(0));

  useEffect(() => {
    // Quick fade + spring scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Quick progress bar animation
    Animated.timing(barWidth, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();

    // Fast navigate - 1.2s total
    const timer = setTimeout(() => {
      router.replace('/');
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo with Scale Animation */}
      <Animated.View 
        style={[
          styles.logoContainer,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <Image
          source={require('../../assets/app-logo.png.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            { 
              width: barWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }
          ]} 
        />
      </View>

      {/* Status Text */}
      <Animated.Text style={[styles.statusText, { opacity: fadeAnim }]}>
        Securing your connection...
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  logoContainer: {
    marginBottom: hp(4),
  },
  logo: {
    width: wp(40),
    height: wp(40),
  },
  progressContainer: {
    width: '60%',
    height: hp(0.4),
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: hp(2.5),
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  statusText: {
    fontSize: fp(12),
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
