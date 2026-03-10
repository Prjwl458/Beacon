import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { wp, hp, fp } from '../utils/responsive';
import { colors, borderRadius, typography } from '../styles/beaconTheme';

/**
 * ErrorBoundary Component
 *
 * Catches React component errors and displays a fallback UI
 * instead of showing a blank white screen.
 *
 * Usage: Wrap your app or specific components with this:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.danger} />
            </View>

            {/* Title */}
            <Text style={styles.title}>SYSTEM MALFUNCTION</Text>

            {/* Description */}
            <Text style={styles.message}>
              An unexpected error has occurred. The application has encountered a critical failure.
            </Text>

            {/* Error Details Card */}
            {this.state.error && (
              <View style={styles.errorCard}>
                <View style={styles.errorCardHeader}>
                  <MaterialCommunityIcons name="code-tags" size={16} color={colors.textMuted} />
                  <Text style={styles.errorCardLabel}>Error Details</Text>
                </View>
                <Text style={styles.errorDetail} selectable>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            {/* Retry Button */}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="refresh" size={20} color={colors.background} />
              <Text style={styles.retryButtonText}>ATTEMPT RECOVERY</Text>
            </TouchableOpacity>

            {/* Footer Text */}
            <Text style={styles.footerText}>
              If the problem persists, try restarting the application.
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(8),
  },
  iconContainer: {
    marginBottom: hp(3),
  },
  title: {
    fontSize: fp(24),
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: wp(4),
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  message: {
    fontSize: fp(15),
    fontWeight: typography.fontWeight.light,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: hp(3),
    marginBottom: hp(3),
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: wp(4),
    marginBottom: hp(3),
    width: '100%',
    maxWidth: 400,
  },
  errorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: wp(2),
  },
  errorCardLabel: {
    fontSize: fp(12),
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  errorDetail: {
    fontSize: fp(12),
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: hp(2.5),
    backgroundColor: colors.dangerLight,
    padding: wp(4),
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: wp(4),
    paddingHorizontal: wp(6),
    borderRadius: borderRadius.md,
    gap: wp(2),
    marginBottom: wp(4),
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: fp(14),
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  footerText: {
    fontSize: fp(13),
    fontWeight: typography.fontWeight.light,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: hp(3),
  },
});
