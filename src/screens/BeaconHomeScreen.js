import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Linking,
  Animated,
  Easing,
  Clipboard,
  LayoutAnimation,
  InteractionManager,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useServer } from '../context/ServerContext';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';
import { analyzeMessage } from '../services/api';
import { AnalysisDetailModal } from '../components/AnalysisDetailModal';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp, fp } from '../utils/responsive';

// ─── Design System Colors ─────────────────────────────────────────────────────
const COLORS = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#111111',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#FFB703',
  accentDark: '#F59E0B',
  success: '#16A34A',
  successBg: '#ECFDF5',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  border: '#F3F4F6',
  inputBg: '#F9FAFB',
  mono: '#1F2937',
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// ─── Helper Functions ─────────────────────────────────────────────────────────
const relativeTime = (ts) => {
  if (!ts) return '';
  const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
};

const truncateText = (text, maxLength = 40) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const getRiskLevel = (score) => {
  if (score >= 70) return { label: 'CRITICAL THREAT', icon: 'shield-alert', color: COLORS.danger, bg: COLORS.dangerBg };
  if (score >= 30) return { label: 'SUSPICIOUS', icon: 'alert', color: COLORS.warning, bg: COLORS.warningBg };
  return { label: 'SAFE TRANSACTION', icon: 'shield-check', color: COLORS.success, bg: COLORS.successBg };
};

// ─── Loading Stages Configuration ─────────────────────────────────────────────
const LOADING_STAGES = [
  { progress: 15, message: 'Initializing secure connection...' },
  { progress: 30, message: 'Scanning message content...' },
  { progress: 50, message: 'Checking for suspicious links...' },
  { progress: 70, message: 'Analyzing entities & patterns...' },
  { progress: 85, message: 'Calculating risk score...' },
  { progress: 100, message: 'Analysis complete' },
  { progress: 100, message: 'Server taking longer than expected...' },
];

// ─── Toast Notification Component ─────────────────────────────────────────────
const Toast = ({ visible, message, type = 'error', onClose }) => {
  if (!visible) return null;

  const config = type === 'error' 
    ? { bg: COLORS.dangerBg, text: COLORS.danger, icon: 'alert-circle' }
    : { bg: COLORS.successBg, text: COLORS.success, icon: 'check-circle' };

  return (
    <View style={styles.toastOverlay}>
      <View style={[styles.toastContainer, { backgroundColor: config.bg }]}>
        <MaterialCommunityIcons name={config.icon} size={20} color={config.text} />
        <Text style={[styles.toastText, { color: config.text }]}>{message}</Text>
        <TouchableOpacity onPress={onClose} style={styles.toastClose}>
          <MaterialCommunityIcons name="close" size={18} color={config.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Offline Info Modal Component ─────────────────────────────────────────────
const OfflineModal = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <MaterialCommunityIcons name="cloud-off-outline" size={56} color={COLORS.warning} />
          </View>
          <Text style={styles.modalTitle}>Server Offline</Text>
          <Text style={styles.modalDescription}>
            Paste a message and tap <Text style={styles.modalHighlight}>Run Analysis</Text> to wake it up.
          </Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Report Scam Modal Component ──────────────────────────────────────────────
const ReportScamModal = ({ visible, onClose }) => {
  if (!visible) return null;

  const handleOpenPortal = useCallback(async () => {
    const url = 'https://cybercrime.gov.in';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      // Silently handle error
    }
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.reportModalOverlay}>
        <View style={styles.reportModalContent}>
          <View style={styles.reportModalHeader}>
            <View style={styles.reportModalIconContainer}>
              <MaterialCommunityIcons name="flag-outline" size={32} color={COLORS.danger} />
            </View>
            <Text style={styles.reportModalTitle}>Report Scam</Text>
            <Text style={styles.reportModalDescription}>Take action against this threat</Text>
          </View>

          <TouchableOpacity
            style={styles.reportOptionPrimary}
            onPress={handleOpenPortal}
            activeOpacity={0.8}
          >
            <View style={styles.reportOptionLeft}>
              <View style={[styles.reportOptionIcon, { backgroundColor: COLORS.dangerBg }]}>
                <MaterialCommunityIcons name="shield-account" size={22} color={COLORS.danger} />
              </View>
              <View style={styles.reportOptionText}>
                <Text style={styles.reportOptionTitle}>Cyber Crime Portal</Text>
                <Text style={styles.reportOptionDesc}>File official complaint at 1930.gov.in</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={20} color={COLORS.danger} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportModalClose} onPress={onClose}>
            <Text style={styles.reportModalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Header Component ─────────────────────────────────────────────────────────
const Header = ({ onAboutPress }) => (
  <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.bg }}>
    <View style={styles.header}>
      {/* Left: Half-Circle Icon (Tappable - Opens About Screen) */}
      <TouchableOpacity
        style={styles.headerLeft}
        onPress={onAboutPress}
        activeOpacity={0.7}
      >
        <Image
          source={require('../../assets/half-circle 2.png')}
          style={styles.headerLeftIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Center: App Logo */}
      <View style={styles.headerCenter}>
        <Image
          source={require('../../assets/app-logo.png.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      {/* Right: Empty for balance */}
      <View style={styles.headerRight} />
    </View>
  </SafeAreaView>
);

// ─── Security Pulse Component ─────────────────────────────────────────────────
const SecurityPulse = ({ serverStatus, onOfflinePress }) => {
  const isOnline = serverStatus === 'LIVE';
  
  return (
    <View style={styles.securityPulse}>
      <Text style={styles.securityPulseLabel}>SECURITY PULSE</Text>
      <View style={styles.securityPulseRow}>
        <Text style={styles.securityPulseText}>
          {isOnline ? 'System operating normally' : 'Service temporarily unavailable'}
        </Text>
        <TouchableOpacity 
          style={[styles.securityPulseBadge, isOnline ? styles.securityPulseBadgeSecure : styles.securityPulseBadgeWarning]}
          onPress={isOnline ? null : onOfflinePress}
          disabled={isOnline}
          activeOpacity={0.7}
        >
          <View style={[styles.securityPulseDot, isOnline ? styles.securityPulseDotSecure : styles.securityPulseDotWarning]} />
          <Text style={[styles.securityPulseBadgeText, isOnline ? styles.securityPulseBadgeTextSecure : styles.securityPulseBadgeTextWarning]}>
            {isOnline ? 'SECURE' : 'OFFLINE'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Manual Analysis Card ─────────────────────────────────────────────────────
const ManualAnalysisCard = React.memo(({
  inputText,
  setInputText,
  isAnalyzing,
  isWaking,
  onAnalyze,
  inputRef,
  onContainerPress,
  clipboardContent,
  onPaste,
  loadingStage,
  estimatedTime,
}) => {
  // Pulse animation for loading state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Press animation for paste button
  const pasteButtonScale = useRef(new Animated.Value(1)).current;
  const pasteButtonOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isAnalyzing) {
      // Smooth pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAnalyzing]);

  // Press animations for paste button
  const handlePasteButtonPressIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(pasteButtonScale, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pasteButtonOpacity, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePasteButtonPressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(pasteButtonScale, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(pasteButtonOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Loading stages display
  const currentStageMessage = loadingStage >= 0 && loadingStage < LOADING_STAGES.length
    ? LOADING_STAGES[loadingStage].message
    : 'Processing...';

  // Check if clipboard has content to show paste button
  const hasClipboardContent = clipboardContent && clipboardContent.trim().length > 0;

  return (
    <View style={styles.analysisCard}>
      <Text style={styles.analysisCardTitle}>Analysis</Text>
      <Text style={styles.analysisCardDescription}>
        Deep AI scan for suspicious SMS links or messages.
      </Text>

      {/* Paste Button - Shows when clipboard has content */}
      {hasClipboardContent && (
        <Animated.View
          style={[
            styles.pasteButtonContainer,
            {
              transform: [{ scale: pasteButtonScale }],
              opacity: pasteButtonOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.pasteButton}
            onPress={onPaste}
            onPressIn={handlePasteButtonPressIn}
            onPressOut={handlePasteButtonPressOut}
            activeOpacity={1}
          >
            <MaterialCommunityIcons name="content-paste" size={16} color={COLORS.accent} />
            <Text style={styles.pasteButtonText}>Paste</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.inputWrapper}>
        <TouchableOpacity
          style={[styles.inputContainer, styles.inputContainerFocusable]}
          onPress={onContainerPress}
          activeOpacity={1}
        >
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            multiline
            numberOfLines={4}
            placeholder="Paste suspicious text here..."
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            textAlignVertical="top"
            editable={!isAnalyzing}
            returnKeyType="default"
            blurOnSubmit={false}
            onSubmitEditing={() => false}
          />
        </TouchableOpacity>

        {/* Clear Button - Only shows when there's text */}
        {inputText.length > 0 && !isAnalyzing && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setInputText('')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Analyze Button / Progressive Loading State */}
      {isAnalyzing ? (
        <View style={styles.loadingContainer}>
          {/* Loading Message */}
          <View style={styles.loadingMessageContainer}>
            <Animated.View style={{ opacity: pulseAnim }}>
              <MaterialCommunityIcons name="shield-search" size={24} color={COLORS.accent} />
            </Animated.View>
            <Text style={styles.loadingMessage}>{currentStageMessage}</Text>
            {estimatedTime > 0 && (
              <Text style={styles.loadingTime}>~{estimatedTime}s remaining</Text>
            )}
          </View>

          {/* Stage Indicators */}
          <View style={styles.loadingStagesContainer}>
            {LOADING_STAGES.map((stage, index) => (
              <View
                key={index}
                style={[
                  styles.stageDot,
                  index <= loadingStage && styles.stageDotActive,
                  index === loadingStage && styles.stageDotCurrent,
                ]}
              />
            ))}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.analyzeButton, !inputText.trim() && styles.analyzeButtonDisabled]}
          onPress={onAnalyze}
          disabled={!inputText.trim() || isAnalyzing}
          activeOpacity={0.9}
        >
          <View style={styles.analyzeButtonContent}>
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" />
                <Text style={styles.analyzeButtonText}>Run Analysis</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.inputText === nextProps.inputText &&
    prevProps.isAnalyzing === nextProps.isAnalyzing &&
    prevProps.isWaking === nextProps.isWaking &&
    prevProps.loadingStage === nextProps.loadingStage &&
    prevProps.estimatedTime === nextProps.estimatedTime &&
    prevProps.clipboardContent === nextProps.clipboardContent &&
    prevProps.onPaste === nextProps.onPaste
  );
});

// ─── Signal Badge Component ───────────────────────────────────────────────────
const SignalBadge = ({ icon, label, type = 'secure' }) => {
  const config = type === 'secure' 
    ? { bg: COLORS.successBg, text: COLORS.success, icon: COLORS.success }
    : type === 'warning'
    ? { bg: COLORS.warningBg, text: COLORS.warning, icon: COLORS.warning }
    : { bg: COLORS.dangerBg, text: COLORS.danger, icon: COLORS.danger };

  return (
    <View style={[styles.signalBadge, { backgroundColor: config.bg }]}>
      <MaterialCommunityIcons name={icon} size={14} color={config.icon} />
      <Text style={[styles.signalBadgeText, { color: config.text }]}>{label}</Text>
    </View>
  );
};

// ─── Scan Result Card - Premium Banner Style ──────────────────────────────────
const ScanResultCard = ({ analysisKey, result, inputText, lastAnalyzedText, onReRun, onReportScam }) => {
  const rawScore = result?.riskScore ?? 0;
  const risk = typeof rawScore === 'string'
    ? parseInt(rawScore.replace('%', ''), 10) || 0
    : Number(rawScore);

  // ─── 1. Refs — created once, never during render ───────
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animatedBarWidth = useRef(new Animated.Value(0));
  const bulletAnimations = useRef({});

  // ─── State for percentage text (prevents flash of decimals) ───────
  const [displayPercent, setDisplayPercent] = useState(0);

  // ─── Card entry animation refs (smooth rise + fade in) ───────
  const cardEntryOpacity = useRef(new Animated.Value(0)).current;
  const cardEntryTranslateY = useRef(new Animated.Value(30)).current;

  // ─── Content ready gate (prevents flash on mount) ───────
  const [isAnimationReady, setIsAnimationReady] = useState(false);

  // ─── Card entry effect — runs ONCE on mount ───────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardEntryOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardEntryTranslateY, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Extract intelligence data from result
  const intelligence = result?.intelligence || result || {};
  const isDimmed = inputText !== lastAnalyzedText;
  const isHighRisk = risk >= 70;
  const isSecure = risk < 30;
  const isMedium = risk >= 30 && risk < 70;

  // Check if manual extraction was used
  const isManualExtraction = intelligence.agentNotes?.toLowerCase().includes('manual extraction') || false;

  // ─── 2. Build bullet points from backend fields ────────
  const getSignals = (score, intel) => {
    // If no intelligence data, return empty array - never guess
    if (!intel) return [];

    const signals = [];

    // ALWAYS add Manual Extraction notice first if applicable
    if (isManualExtraction) {
      signals.push({ icon: 'hand-back-left', label: 'Manual Extraction Used' });
    }

    // HIGH RISK / PHISHING DETECTED
    if (score >= 70 || intel.isPhishing) {
      // Show scamType OR "Phishing Detected" — never both
      if (intel.scamType) {
        signals.push({ icon: 'shield-alert', label: intel.scamType });
      } else {
        signals.push({ icon: 'alert-circle', label: 'Phishing Detected' });
      }

      if (intel.urgencyLevel === 'High') {
        signals.push({ icon: 'alert', label: 'High Urgency' });
      } else if (intel.urgencyLevel === 'Medium') {
        signals.push({ icon: 'clock-outline', label: 'Medium Urgency' });
      }
      if (intel.phishingLinks?.length > 0) {
        signals.push({ icon: 'link-variant', label: `${intel.phishingLinks.length} Suspicious Link${intel.phishingLinks.length > 1 ? 's' : ''}` });
      }
      if (intel.upiIds?.length > 0) {
        signals.push({ icon: 'account-cash', label: `${intel.upiIds.length} UPI ID${intel.upiIds.length > 1 ? 's' : ''}` });
      }

      // Cap at 4 signals max
      return signals.slice(0, 4);
    }

    // MEDIUM RISK (30-69)
    if (score >= 30) {
      signals.push({ icon: 'alert', label: 'Suspicious Pattern' });
      if (intel.phishingLinks?.length > 0) {
        signals.push({ icon: 'link-variant', label: 'Links Detected' });
      }
      // Cap at 4 signals max
      return signals.slice(0, 4);
    }

    // LOW RISK (0-29) - SAFE - Return empty, never show "No Threats" guess
    return [];
  };

  const signals = getSignals(risk, intelligence);

  // ─── 3. Reset values BEFORE render (useLayoutEffect) ────
  useLayoutEffect(() => {
    // Reset ALL animated values immediately, before first paint
    progressAnim.setValue(0);
    setDisplayPercent(0);
    animatedBarWidth.current.setValue(0);
    cardOpacity.setValue(0);
    cardScale.setValue(0.92);

    // Wipe stale bullet animations
    bulletAnimations.current = {};

    // Build fresh bullet Animated.Values
    signals.forEach((_, index) => {
      bulletAnimations.current[`bullet-${index}`] = {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(12),
        scale: new Animated.Value(0.95),
      };
    });
  }, [analysisKey]);

  // ─── 4. Start animations AFTER render ───────────────────
  useEffect(() => {
    // Step 1: Hide content immediately to prevent flash
    setIsAnimationReady(false);

    // Step 2: Reset ALL animated values
    progressAnim.setValue(0);
    setDisplayPercent(0);
    animatedBarWidth.current.setValue(0);
    cardOpacity.setValue(0);
    cardScale.setValue(0.92);

    // Step 3: Wipe stale bullet animations
    bulletAnimations.current = {};

    // Step 4: Build fresh bullet Animated.Values
    signals.forEach((_, index) => {
      bulletAnimations.current[`bullet-${index}`] = {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(12),
        scale: new Animated.Value(0.95),
      };
    });

    // Step 5: Tiny delay to let reset settle, then reveal + animate
    const setup = setTimeout(() => {
      // Timing constants
      const CARD_DURATION = 250;
      const PROGRESS_DURATION = 1200;
      const BULLET_STAGGER = 80;
      const BULLET_DURATION = 300;
      const BULLET_DELAY = 400;

      setIsAnimationReady(true); // Reveal content

      // Add listener to drive percentage text
      const listener = progressAnim.addListener(({ value }) => {
        setDisplayPercent(Math.round(value));
      });

      // Build bullet animation sequence
      const bulletSequence = signals.map((_, index) => {
        const anim = bulletAnimations.current[`bullet-${index}`];
        return Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: BULLET_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: BULLET_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            tension: 400,
            friction: 28,
            useNativeDriver: true,
          }),
        ]);
      });

      // Step E: Run card entrance first
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: CARD_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 300,
          friction: 25,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Step F: Run progress bar + staggered bullets on same timeline
        Animated.parallel([
          // Progress bar animates over 1200ms
          Animated.timing(progressAnim, {
            toValue: risk,
            duration: PROGRESS_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          // Bar width animates in sync
          Animated.timing(animatedBarWidth.current, {
            toValue: risk,
            duration: PROGRESS_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          // Bullets stagger in after 400ms delay
          Animated.sequence([
            Animated.delay(BULLET_DELAY),
            Animated.stagger(BULLET_STAGGER, bulletSequence),
          ]),
        ]).start(() => {
          // Cleanup listener after animation completes
          progressAnim.removeListener(listener);
        });
      });
    }, 50); // 50ms to let reset settle, invisible to user

    return () => clearTimeout(setup);

  }, [analysisKey]); // ← analysisKey ONLY, triggers on every new analysis

  // Format status label
  const getStatusLabel = () => {
    if (risk >= 70) return 'Critical Risk';
    if (risk >= 30) return 'Moderate Risk';
    return 'Secure';
  };

  // Get colors based on risk level - matching banner exactly
  const getThemeColors = () => {
    if (isHighRisk) {
      return {
        primary: '#991B1B', // Dark red for text
        secondary: '#DC2626', // Bright red for progress
        bgGradient: '#FEF2F2', // Very light red tint
        pillBg: '#FEE2E2', // Light pink for pill
        iconBg: '#FEE2E2', // Light pink circle
      };
    } else if (isMedium) {
      return {
        primary: '#92400E', // Dark amber
        secondary: '#F59E0B', // Amber
        bgGradient: '#FFFBEB',
        pillBg: '#FEF3C7',
        iconBg: '#FEF3C7',
      };
    } else {
      return {
        primary: '#065F46', // Dark green
        secondary: '#16A34A', // Green
        bgGradient: '#ECFDF5',
        pillBg: '#D1FAE5',
        iconBg: '#D1FAE5',
      };
    }
  };

  const theme = getThemeColors();

  return (
    <Animated.View
      style={{
        opacity: cardEntryOpacity,
        transform: [{ translateY: cardEntryTranslateY }],
      }}
    >
      <View style={{ opacity: isAnimationReady ? 1 : 0 }}>
        <Animated.View
          style={[
            styles.resultCardBanner,
            isDimmed && styles.resultCardDimmed,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Top accent border */}
          <View style={[styles.resultCardTopBorder, { backgroundColor: theme.secondary }]} />

          {/* Subtle gradient background */}
          <View style={[styles.resultCardGradient, { backgroundColor: theme.bgGradient }]} />

      {/* Header */}
      <View style={styles.resultHeaderBanner}>
        <Text style={styles.resultLabelBanner}>RISK ASSESSMENT</Text>

        <View style={styles.resultScoreSection}>
          <View style={styles.resultScoreSectionLeft}>
            <Text style={[styles.resultScoreBanner, { color: theme.primary }]}>
              {displayPercent}%
            </Text>
            <View style={[styles.resultPillBanner, { backgroundColor: theme.pillBg }]}>
              <Text style={[styles.resultPillTextBanner, { color: theme.primary }]}>
                {getStatusLabel()}
              </Text>
            </View>
          </View>

          <View style={[styles.resultIconCircleBanner, { backgroundColor: theme.iconBg }]}>
            <MaterialCommunityIcons
              name={isSecure ? 'shield-check' : isHighRisk ? 'shield-alert' : 'alert'}
              size={24}
              color={theme.primary}
            />
          </View>
        </View>
      </View>

      {/* Progress Bar - thick, rounded (perfectly synced with percentage) */}
      <View style={styles.progressContainerBanner}>
        <View style={styles.progressTrackBanner}>
          <Animated.View
            style={[
              styles.progressFillBanner,
              {
                width: animatedBarWidth.current.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
                backgroundColor: theme.secondary,
              }
            ]}
          />
        </View>
      </View>

      {/* Signal Pills - stacked, rounded rectangles with staggered fade-in */}
      <View style={styles.signalSectionBanner}>
        {signals.map((signal, index) => {
          const anim = bulletAnimations.current[`bullet-${index}`];
          // Fallback: render without animation, never skip
          if (!anim) {
            return (
              <View key={index} style={styles.signalPillBanner}>
                <View style={[styles.signalDotBanner, { backgroundColor: theme.primary }]} />
                <Text style={[styles.signalPillTextBanner, { color: theme.primary }]}>
                  {signal.label}
                </Text>
              </View>
            );
          }
          return (
            <Animated.View
              key={index}
              style={[
                styles.signalPillBanner,
                {
                  backgroundColor: theme.pillBg + '80',
                  opacity: anim.opacity,
                  transform: [
                    { translateY: anim.translateY },
                    { scale: anim.scale },
                  ],
                },
              ]}
            >
              <View style={[styles.signalDotBanner, { backgroundColor: theme.primary }]} />
              <Text style={[styles.signalPillTextBanner, { color: theme.primary }]}>
                {signal.label}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Report Scam Button - Only for high risk */}
      {isHighRisk && (
        <TouchableOpacity style={styles.reportScamButtonBanner} onPress={onReportScam}>
          <MaterialCommunityIcons name="flag-outline" size={20} color={theme.primary} />
          <Text style={[styles.reportScamTextBanner, { color: theme.primary }]}>[ ! ] REPORT SCAM</Text>
        </TouchableOpacity>
      )}

      {isDimmed && (
        <TouchableOpacity style={styles.rerunButton} onPress={onReRun}>
          <MaterialCommunityIcons name="refresh" size={16} color={COLORS.accent} />
          <Text style={styles.rerunText}>Re-run analysis</Text>
        </TouchableOpacity>
      )}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// ─── History Item Component - Dossier Style ───────────────────────────────────
const HistoryItem = ({ item, onPress }) => {
  const riskScore = item.riskScore ?? 0;
  const risk = getRiskLevel(riskScore);

  return (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Left: Status Icon - 36px Circle */}
      <View style={[styles.historyIconContainer, { backgroundColor: risk.bg }]}>
        <MaterialCommunityIcons
          name={risk.icon}
          size={18}
          color={risk.color}
        />
      </View>

      {/* Center: Content */}
      <View style={styles.historyContent}>
        {/* Header Line */}
        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: risk.color }]}>
            {risk.label}
          </Text>
          <Text style={styles.historyTimestamp}>• {relativeTime(item.timestamp)}</Text>
        </View>

        {/* Data Preview */}
        <Text style={styles.historyPreview} numberOfLines={1}>
          {truncateText(item.originalText, 45)}
        </Text>

        {/* Telemetry Bar */}
        <View style={styles.historyTelemetry}>
          <Text style={styles.historyTelemetryText}>Score: {riskScore}%</Text>
          <Text style={styles.historyTelemetryDivider}>|</Text>
          <Text style={styles.historyTelemetryText}>{item.latency_ms ?? '--'}ms</Text>
        </View>
      </View>

      {/* Right: Chevron */}
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={COLORS.textMuted}
      />
    </TouchableOpacity>
  );
};

// ─── Scan History Section ─────────────────────────────────────────────────────
const ScanHistory = ({ history, onViewAll, onItemPress }) => {
  // Use getHistory to ensure we have the latest sorted data
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
  
  return (
    <View style={styles.historySection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECENT SCANS</Text>
        {sortedHistory.length > 0 && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.historyList}>
        {sortedHistory.length > 0 ? (
          sortedHistory.slice(0, 5).map((item, index) => (
            <HistoryItem key={item.id || index} item={item} onPress={onItemPress} />
          ))
        ) : (
          <View style={styles.emptyHistory}>
            <View style={styles.emptyHistoryIconContainer}>
              <MaterialCommunityIcons name="shield-check" size={40} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyHistoryText}>No scans yet</Text>
            <Text style={styles.emptyHistorySubtext}>Analyze messages to see them here</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen Component ────────────────────────────────────────────────────
export default function BeaconHomeScreen() {
  const router = useRouter();
  const { isServerReady, wakeUp, serverStatus } = useServer();
  const { history, addToHistory, getHistory, clearHistory, refreshHistory, isLoaded, count } = useAnalysisHistory();

  const [inputText, setInputText] = useState('');
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisKey, setAnalysisKey] = useState(0);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  // Offline modal state
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Report scam modal state
  const [showReportModal, setShowReportModal] = useState(false);

  // Detail modal state (for history item click)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Network connectivity state
  const [isConnected, setIsConnected] = useState(true);

  // Clipboard content state
  const [clipboardContent, setClipboardContent] = useState(null);

  // Progressive loading state
  const [loadingStage, setLoadingStage] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);

  // Get sorted history (newest first)
  const sortedHistory = useMemo(() => getHistory(), [getHistory, history]);

  // Refresh history when screen comes into focus (e.g., returning from HistoryScreen)
  useFocusEffect(
    useCallback(() => {
      refreshHistory();
    }, [refreshHistory])
  );

  // Show toast notification
  const showToast = useCallback((message, type = 'error') => {
    setToast({ visible: true, message, type });
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  }, []);

  // Hide toast
  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // Network connectivity listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      
      // Show toast when internet is lost
      if (!connected) {
        showToast('No internet connection. Please check your network settings.', 'error');
      }
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, [showToast]);

  // Clipboard listener - checks when input is empty
  useEffect(() => {
    const checkClipboard = async () => {
      // Only check clipboard when input is empty
      if (inputText.trim() !== '') return;
      
      try {
        const content = await Clipboard.getString();
        // Only update if content exists and is reasonable length
        if (content && content.trim().length > 0 && content.length < 500) {
          setClipboardContent(content);
        } else {
          // Clear clipboard content if clipboard is empty
          setClipboardContent(null);
        }
      } catch (error) {
        setClipboardContent(null);
      }
    };

    checkClipboard();
  }, [inputText]);

  // Handle offline badge press
  const handleOfflinePress = useCallback(() => {
    setShowOfflineModal(true);
  }, []);

  // Close offline modal
  const closeOfflineModal = useCallback(() => {
    setShowOfflineModal(false);
  }, []);

  // Open report scam modal
  const openReportModal = useCallback(() => {
    setShowReportModal(true);
  }, []);

  // Close report scam modal
  const closeReportModal = useCallback(() => {
    setShowReportModal(false);
  }, []);

  // Open detail modal for history item
  const handleHistoryItemPress = useCallback((item) => {
    setSelectedHistoryItem(item);
  }, []);

  // Close detail modal
  const closeDetailModal = useCallback(() => {
    setSelectedHistoryItem(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) return;

    // COUNT WORDS - Short messages (3 or fewer) can proceed
    const wordCount = inputText.trim().split(/\s+/).length;
    const isShortMessage = wordCount <= 3;

    // SERVER GATE - Only for messages with more than 3 words
    if (!isShortMessage) {
      if (serverStatus === 'OFFLINE') {
        showToast('Starting server, please wait and try again...', 'info');
        wakeUp();
        return;
      }

      if (serverStatus === 'WAKING_UP') {
        showToast('Server is starting up. Please wait and try again.', 'error');
        return;
      }
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setLoadingStage(0);
    setEstimatedTime(0);

    // Simulate progressive loading with realistic timing
    const analysisStartTime = Date.now();
    const estimatedTotalTime = 5000; // 5 seconds base estimate

    // Progressive loading animation (using ref to avoid stale closure)
    const loadingStageRef = { current: 0 };
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - analysisStartTime;
      const remaining = Math.max(0, estimatedTotalTime - elapsed);

      setEstimatedTime(Math.ceil(remaining / 1000));

      // Update stage based on progress
      const progressPercent = Math.min(95, Math.floor((elapsed / estimatedTotalTime) * 100));
      const currentStageIndex = LOADING_STAGES.findIndex(
        stage => stage.progress > progressPercent
      ) - 1;

      if (currentStageIndex >= 0 && currentStageIndex !== loadingStageRef.current) {
        loadingStageRef.current = currentStageIndex;
        setLoadingStage(currentStageIndex);
      }
    }, 100);

    // After 5 seconds, show server message if still loading
    const retryTimeout = setTimeout(() => {
      setLoadingStage(LOADING_STAGES.length - 1); // Set to last stage (server message)
      setEstimatedTime(0);
    }, 5000);

    try {
      setIsWaking(true);
      // Always attempt to wake up the server before analysis
      // This ensures Render cold start is triggered
      const wakeSuccess = await wakeUp();

      // Wait a bit for server to be ready if it was waking up
      if (wakeSuccess) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      // Silently handle wake up errors
    } finally {
      setIsWaking(false);
    }

    try {
      const res = await analyzeMessage({
        sessionId: `beacon_${Date.now()}`,
        message: { text: inputText, senderId: 'user', type: 'text' },
        metadata: { channel: 'manual_entry' },
      });

      // Clear intervals/timeouts on success
      clearInterval(progressInterval);
      clearTimeout(retryTimeout);

      const score = res.risk_score ?? res.riskScore ?? 0;
      const sanitizedResult = {
        ...res,
        riskScore: score,
        latency_ms: res.latency_ms ?? res.intelligence?.latency_ms ?? 0,
      };

      setAnalysisResult(sanitizedResult);
      setLastAnalyzedText(inputText);
      setAnalysisKey(prev => prev + 1); // Force remount for fresh animations

      // Only save to history if we got a valid response with risk score
      if (sanitizedResult.riskScore !== undefined && sanitizedResult.riskScore !== null) {
        await addToHistory(sanitizedResult, inputText, 'user');
      }
    } catch (error) {
      clearInterval(progressInterval);
      clearTimeout(retryTimeout);

      // Show error toast to user
      showToast('Server unavailable. Try again later.', 'error');

      // Clear any result - never show fake/safe result on error
      setAnalysisResult(null);
      setLastAnalyzedText('');
    } finally {
      setIsAnalyzing(false);
      clearTimeout(retryTimeout);
      // Reset after delay
      setTimeout(() => {
        setLoadingStage(0);
        setEstimatedTime(0);
      }, 500);
    }
  }, [inputText, showToast, wakeUp, addToHistory]);

  const handleReRun = useCallback(() => {
    if (inputText.trim()) {
      handleAnalyze();
    }
  }, [inputText, handleAnalyze]);

  // Focus input when tapping the input container
  const handleContainerPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Navigate to About screen
  const handleAboutPress = useCallback(() => {
    router.push('/about');
  }, [router]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Header onAboutPress={handleAboutPress} />

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Offline Info Modal */}
      <OfflineModal
        visible={showOfflineModal}
        onClose={closeOfflineModal}
      />
      
      {/* Report Scam Modal */}
      <ReportScamModal
        visible={showReportModal}
        onClose={closeReportModal}
      />

      {/* Detail Modal for History Item */}
      <AnalysisDetailModal
        visible={!!selectedHistoryItem}
        item={selectedHistoryItem}
        onClose={closeDetailModal}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Security Pulse */}
          <SecurityPulse 
            serverStatus={serverStatus} 
            onOfflinePress={handleOfflinePress}
          />

          {/* Manual Analysis Card */}
          <View pointerEvents="box-none">
            <ManualAnalysisCard
              inputText={inputText}
              setInputText={setInputText}
              isAnalyzing={isAnalyzing}
              isWaking={isWaking}
              onAnalyze={handleAnalyze}
              inputRef={inputRef}
              onContainerPress={() => inputRef.current?.focus()}
              clipboardContent={clipboardContent}
              onPaste={() => {
                if (clipboardContent) {
                  setInputText(clipboardContent);
                }
              }}
              loadingStage={loadingStage}
              estimatedTime={estimatedTime}
            />
          </View>

          {/* Scan Result Card */}
          {analysisResult && (
            <ScanResultCard
              key={analysisKey}
              analysisKey={analysisKey}
              result={analysisResult}
              inputText={inputText}
              lastAnalyzedText={lastAnalyzedText}
              onReRun={handleReRun}
              onReportScam={openReportModal}
            />
          )}

          {/* Scan History */}
          <ScanHistory
            history={sortedHistory}
            onViewAll={() => router.push('/history')}
            onItemPress={handleHistoryItemPress}
          />

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  toastOverlay: {
    position: 'absolute',
    top: hp(6),
    left: wp(4),
    right: wp(4),
    zIndex: 9999,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: wp(4),
    gap: wp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  toastText: {
    flex: 1,
    fontSize: fp(14),
    fontWeight: '600',
  },
  toastClose: {
    padding: wp(1),
  },

  // ── Offline Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: wp(6),
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 12,
  },
  modalIconContainer: {
    marginBottom: wp(4),
    marginTop: wp(2),
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: wp(4),
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: fp(14),
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: wp(6),
    paddingHorizontal: wp(2),
  },
  modalHighlight: {
    fontWeight: '600',
    color: COLORS.accent,
  },
  modalButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: wp(6),
    paddingVertical: wp(4),
    borderRadius: RADIUS.full,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Report Scam Modal
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reportModalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: wp(4),
  },
  reportModalHeader: {
    alignItems: 'center',
    paddingVertical: wp(4),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reportModalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: wp(2),
  },
  reportModalTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: wp(1),
  },
  reportModalDescription: {
    fontSize: fp(14),
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  reportOptions: {
    padding: wp(4),
  },
  reportOptionPrimary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    margin: wp(4),
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  reportOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  reportOptionText: {
    flex: 1,
  },
  reportOptionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  reportOptionSubtitle: {
    fontSize: fp(12),
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 4,
  },
  reportOptionDesc: {
    fontSize: fp(13),
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  reportModalClose: {
    marginHorizontal: wp(4),
    marginTop: wp(1),
    paddingVertical: wp(4),
    alignItems: 'center',
  },
  reportModalCloseText: {
    fontSize: fp(15),
    fontWeight: '600',
    color: COLORS.accent,
  },
  flex1: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: wp(2),
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: wp(2),
    height: 72,
  },
  headerLeft: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLeftIcon: {
    width: 24,
    height: 24,
    tintColor: '#111111',
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: wp(55),
    height: hp(9),
    maxWidth: '70%',
  },
  headerRight: {
    width: 40,
  },

  // ── Security Pulse
  securityPulse: {
    marginBottom: wp(4),
  },
  securityPulseLabel: {
    fontSize: fp(10),
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: wp(1),
  },
  securityPulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityPulseText: {
    fontSize: fp(14),
    color: COLORS.textSecondary,
  },
  securityPulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: wp(1),
    borderRadius: RADIUS.full,
    gap: wp(1),
  },
  securityPulseBadgeSecure: {
    backgroundColor: COLORS.successBg,
  },
  securityPulseBadgeWarning: {
    backgroundColor: COLORS.warningBg,
  },
  securityPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  securityPulseDotSecure: {
    backgroundColor: COLORS.success,
  },
  securityPulseDotWarning: {
    backgroundColor: COLORS.warning,
  },
  securityPulseBadgeText: {
    fontSize: fp(11),
    fontWeight: '700',
  },
  securityPulseBadgeTextSecure: {
    color: COLORS.success,
  },
  securityPulseBadgeTextWarning: {
    color: COLORS.warning,
  },

  // ── Manual Analysis Card
  analysisCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: wp(4),
    marginBottom: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'visible',
  },
  analysisCardTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: wp(1),
  },
  analysisCardDescription: {
    fontSize: fp(14),
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: wp(4),
  },
  inputContainer: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: wp(2),
    padding: wp(3),
  },
  inputContainerFocusable: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 0,
    padding: wp(3),
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: wp(4),
  },
  pasteButtonContainer: {
    alignSelf: 'flex-end',
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: COLORS.card,
    paddingHorizontal: wp(4),
    paddingVertical: wp(2),
    borderRadius: RADIUS.full,
    marginBottom: wp(2),
    gap: wp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pasteButtonText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: COLORS.accent,
  },
  clearButton: {
    position: 'absolute',
    top: wp(4),
    right: wp(4),
    padding: wp(1),
    backgroundColor: COLORS.card,
    borderRadius: 10,
  },
  textInput: {
    fontSize: fp(15),
    color: COLORS.text,
    minHeight: 100,
    maxHeight: 200,
    lineHeight: 22,
  },
  analyzeButton: {
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  analyzeButtonText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Progressive Loading State
  loadingContainer: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: wp(4),
    gap: wp(2),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: wp(4),
  },
  loadingMessage: {
    fontSize: fp(14),
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  loadingTime: {
    fontSize: fp(12),
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  loadingStagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(1),
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  stageDotActive: {
    backgroundColor: COLORS.accent,
  },
  stageDotCurrent: {
    backgroundColor: COLORS.accent,
    transform: [{ scale: 1.3 }],
  },

  // ── Result Card - Premium Banner Style (Compact & Clean)
  resultCardBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: wp(4),
    marginBottom: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  resultCardTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  resultCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  resultCardDimmed: {
    opacity: 0.7,
  },
  resultHeaderBanner: {
    marginBottom: wp(4),
    position: 'relative',
    zIndex: 1,
  },
  resultLabelBanner: {
    fontSize: fp(10),
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: wp(2),
  },
  resultScoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -8,
  },
  resultScoreSectionLeft: {
    flex: 1,
  },
  resultScoreBanner: {
    fontSize: fp(42),
    fontWeight: '700',
    lineHeight: 52,
    letterSpacing: -1,
    marginBottom: wp(2),
  },
  resultPillBanner: {
    alignSelf: 'flex-start',
    paddingHorizontal: wp(4),
    paddingVertical: wp(1),
    borderRadius: RADIUS.full,
  },
  resultPillTextBanner: {
    fontSize: fp(12),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  resultIconCircleBanner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(2),
    alignSelf: 'center',
  },
  progressContainerBanner: {
    marginBottom: wp(4),
    position: 'relative',
    zIndex: 1,
  },
  progressTrackBanner: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFillBanner: {
    height: '100%',
    borderRadius: 2.5,
  },
  signalSectionBanner: {
    marginBottom: wp(4),
    gap: wp(2),
    position: 'relative',
    zIndex: 1,
  },
  signalPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: wp(2),
    paddingHorizontal: wp(4),
    borderRadius: RADIUS.lg,
    gap: wp(2),
  },
  signalDotBanner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  signalPillTextBanner: {
    fontSize: fp(13),
    fontWeight: '500',
    flex: 1,
  },
  reportScamButtonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: RADIUS.lg,
    paddingVertical: wp(2),
    marginTop: wp(2),
    gap: wp(2),
    position: 'relative',
    zIndex: 1,
  },
  reportScamTextBanner: {
    fontSize: fp(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  aiReportContainer: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    padding: wp(2),
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  aiReportText: {
    fontSize: fp(13),
    color: COLORS.text,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  aiReportTextDanger: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  telemetrySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: wp(2),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  telemetryText: {
    fontSize: fp(11),
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  reportScamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.lg,
    paddingVertical: wp(4),
    marginTop: wp(4),
    gap: wp(2),
  },
  reportScamButtonText: {
    fontSize: fp(15),
    fontWeight: '800',
    color: COLORS.danger,
    letterSpacing: 1,
  },
  rerunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1),
    marginTop: wp(4),
    paddingTop: wp(4),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rerunText: {
    fontSize: fp(13),
    color: COLORS.accent,
    fontWeight: '600',
  },

  // ── Scan History - Dossier Style
  historySection: {
    marginBottom: wp(4),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: wp(2),
    paddingHorizontal: wp(1),
  },
  sectionTitle: {
    fontSize: fp(10),
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  viewAllText: {
    fontSize: fp(12),
    color: COLORS.accent,
    fontWeight: '600',
  },
  historyList: {
    gap: wp(2),
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: wp(4),
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: fp(12),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  historyTimestamp: {
    fontSize: fp(10),
    color: COLORS.textMuted,
    marginLeft: wp(2),
  },
  historyPreview: {
    fontSize: fp(12),
    color: COLORS.mono,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: wp(2),
  },
  historyTelemetry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  historyTelemetryText: {
    fontSize: fp(10),
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  historyTelemetryDivider: {
    fontSize: fp(10),
    color: COLORS.border,
    fontWeight: '300',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: wp(6),
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyHistoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: wp(2),
  },
  emptyHistoryText: {
    fontSize: fp(15),
    fontWeight: '600',
    color: COLORS.text,
    marginTop: wp(2),
  },
  emptyHistorySubtext: {
    fontSize: fp(13),
    color: COLORS.textSecondary,
    marginTop: wp(1),
    textAlign: 'center',
    paddingHorizontal: wp(4),
  },

  // ── Detail Modal (Same as HistoryScreen)
  detailModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  detailModalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: wp(4),
  },
  detailModalHeader: {
    alignItems: 'center',
    paddingVertical: wp(4),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailModalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: wp(2),
  },
  detailModalTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: wp(1),
  },
  detailModalScore: {
    fontSize: fp(28),
    fontWeight: '800',
    letterSpacing: -1,
  },
  detailModalSection: {
    paddingHorizontal: wp(4),
    paddingTop: wp(4),
  },
  detailModalSectionLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: wp(1),
  },
  detailModalMessageContainer: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    padding: wp(4),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailModalMessageText: {
    fontSize: fp(13),
    color: COLORS.mono,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    lineHeight: 20,
  },
  detailModalTelemetryGrid: {
    flexDirection: 'row',
    gap: wp(4),
  },
  detailModalTelemetryItem: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    padding: wp(4),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailModalTelemetryLabel: {
    fontSize: fp(10),
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: wp(1),
  },
  detailModalTelemetryValue: {
    fontSize: fp(14),
    color: COLORS.text,
    fontWeight: '600',
  },
  detailModalEntityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: wp(2),
    paddingVertical: wp(2),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailModalEntityLabel: {
    fontSize: fp(12),
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  detailModalEntityValue: {
    fontSize: fp(12),
    color: COLORS.text,
    flex: 1,
  },
  detailModalCloseButton: {
    marginHorizontal: wp(4),
    marginTop: wp(4),
    paddingVertical: wp(4),
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.full,
  },
  detailModalCloseButtonText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: COLORS.text,
  },
});
