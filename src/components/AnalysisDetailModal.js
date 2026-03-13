import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  TouchableOpacity,
  Linking,
  Clipboard,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography } from '../styles/beaconTheme';
import { wp, hp, fp, screenWidth } from '../utils/responsive';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getRiskLevel = (score) => {
  if (score >= 70) return { label: 'CRITICAL THREAT', icon: 'shield-alert', color: '#DC2626', bg: '#FEF2F2' };
  if (score >= 40) return { label: 'SUSPICIOUS', icon: 'alert', color: '#DC2626', bg: '#FFFBEB' };
  return { label: 'SAFE TRANSACTION', icon: 'shield-check', color: '#059669', bg: '#ECFDF5' };
};

// ─── Analysis Detail Modal ────────────────────────────────────────────────────
export const AnalysisDetailModal = ({ visible, item, onClose }) => {
  // Hooks at top level
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [showShareModal, setShowShareModal] = useState(false);

  // Animation effect
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // Early return if no item
  if (!item || !visible) return null;

  // Risk calculation
  const risk = getRiskLevel(item.riskScore);
  const isHighRisk = item.riskScore >= 70;

  // Share functions
  const handleReportScam = async () => {
    const url = 'https://cybercrime.gov.in';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (error) {
      // Silently handle error
    }
  };

  const getShareText = () => {
    const status = item.riskScore >= 70 ? 'PHISHING DETECTED ⚠️' : 'SAFE ✅';
    const truncatedMessage = item.originalText.length > 120 
      ? item.originalText.substring(0, 120) + '...' 
      : item.originalText;
    const timestamp = new Date(item.timestamp);
    const formattedDate = timestamp.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
    
    return `─────────────────────────
BEACON ANALYSIS REPORT
─────────────────────────
Status:      ${status}
Risk Score:  ${item.riskScore}/100

Message Analyzed:
"${truncatedMessage}"

Findings:
${item.agentNotes || item.intelligence?.agentNotes || 'No specific findings'}

Response Time: ${item.latency_ms ?? item.intelligence?.latency_ms ?? '--'}ms
Analyzed:      ${formattedDate}
─────────────────────────
Beacon v${item.version ?? '1.2.2'} · beacon-app
─────────────────────────`;
  };

  const handleCopyToClipboard = () => {
    Clipboard.setString(getShareText());
    setShowShareModal(false);
    Alert.alert('Copied!', 'Analysis copied to clipboard');
  };

  const handleShareWhatsApp = async () => {
    const encodedText = encodeURIComponent(getShareText());
    const whatsappUrl = `whatsapp://send?text=${encodedText}`;
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) await Linking.openURL(whatsappUrl);
      else Alert.alert('WhatsApp not installed');
    } catch (error) {
      Alert.alert('Error', 'Could not open WhatsApp');
    }
    setShowShareModal(false);
  };

  const handleShare = () => setShowShareModal(true);

  // Render modal content
  return (
    <>
      {/* Main Modal */}
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalBackground}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: risk.bg }]}>
                <MaterialCommunityIcons name={risk.icon} size={48} color={risk.color} />
              </View>
              <Text style={[styles.riskLabel, { color: risk.color }]}>{risk.label}</Text>
              <Text style={styles.riskScore}>{item.riskScore ?? '--'}% Risk Score</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false} bounces={false}>
              {/* Message */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: risk.color }]}>
                  {isHighRisk ? 'Phishing Attempt Detected' : isHighRisk === false && item.riskScore >= 40 ? 'Suspicious Pattern Found' : 'No Threats Detected'}
                </Text>
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{item.originalText}</Text>
                </View>
              </View>

              {/* Telemetry */}
              <View style={styles.telemetrySection}>
                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryLabel}>LATENCY</Text>
                    <View style={styles.telemetryValueBox}>
                      <Text style={styles.telemetryValue}>
                        {(() => {
                          // Try multiple sources for latency
                          const latency = item.latency_ms ?? item.intelligence?.latency_ms ?? 0;
                          return latency ? `${latency}ms` : '--';
                        })()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryLabel}>TIME</Text>
                    <View style={styles.telemetryValueBox}>
                      <Text style={styles.telemetryValue}>
                        {item.timestamp ? formatTimestamp(item.timestamp) : '--'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Entities */}
              {(item.upiIds?.length > 0 || item.bankNames?.length > 0) && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Extracted Evidence</Text>
                  {item.upiIds?.map((upi, i) => (
                    <View key={i} style={[styles.entityBox, { backgroundColor: colors.warning + '20' }]}>
                      <MaterialCommunityIcons name="account-cash" size={20} color={colors.warning} />
                      <View style={styles.entityContent}>
                        <Text style={styles.entityLabel}>UPI ID</Text>
                        <Text style={styles.entityValue}>{upi}</Text>
                      </View>
                    </View>
                  ))}
                  {item.bankNames?.map((bank, i) => (
                    <View key={i} style={[styles.entityBox, { backgroundColor: colors.success + '20' }]}>
                      <MaterialCommunityIcons name="bank" size={20} color={colors.success} />
                      <View style={styles.entityContent}>
                        <Text style={styles.entityLabel}>Bank Account</Text>
                        <Text style={styles.entityValue}>{bank}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {isHighRisk && (
                <TouchableOpacity style={styles.reportButton} onPress={handleReportScam}>
                  <MaterialCommunityIcons name="flag-outline" size={20} color={colors.danger} />
                  <Text style={[styles.actionText, { color: colors.danger }]}>Report Scam</Text>
                </TouchableOpacity>
              )}

              {/* Primary Button - Share for high risk, Close for others */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: isHighRisk ? colors.primary : colors.success }]}
                onPress={isHighRisk ? handleShare : onClose}
              >
                <MaterialCommunityIcons name={isHighRisk ? 'share-variant' : 'check'} size={20} color="#FFFFFF" />
                <Text style={styles.actionTextWhite}>{isHighRisk ? 'Share Analysis' : 'Close'}</Text>
              </TouchableOpacity>

              {/* Additional Close Button for High Risk */}
              {isHighRisk && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent animationType="slide" onRequestClose={() => setShowShareModal(false)}>
        <View style={styles.shareOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowShareModal(false)} />
          <View style={styles.shareContent}>
            <Text style={styles.shareTitle}>Share Analysis</Text>
            <TouchableOpacity style={styles.shareOption} onPress={handleShareWhatsApp}>
              <View style={[styles.shareIcon, { backgroundColor: '#25D366' }]}>
                <MaterialCommunityIcons name="whatsapp" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.shareOptionText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareOption} onPress={handleCopyToClipboard}>
              <View style={[styles.shareIcon, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="content-copy" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.shareOptionText}>Copy to Clipboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareCancel} onPress={() => setShowShareModal(false)}>
              <Text style={styles.shareCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    maxHeight: SCREEN_HEIGHT * 0.90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: wp(4),
    paddingBottom: wp(2),
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  header: {
    alignItems: 'center',
    paddingVertical: wp(6),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: wp(4),
  },
  riskLabel: {
    fontSize: fp(14),
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: wp(2),
    textTransform: 'uppercase',
  },
  riskScore: {
    fontSize: fp(36),
    fontWeight: typography.fontWeight.bold,
    color: '#111827',
    letterSpacing: -1,
  },
  section: {
    padding: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: fp(14),
    fontWeight: typography.fontWeight.medium,
    marginBottom: wp(3),
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: fp(14),
    fontWeight: typography.fontWeight.semibold,
    color: '#6B7280',
    marginBottom: wp(3),
  },
  messageBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp(3),
    padding: wp(4),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: fp(14),
    color: '#374151',
    lineHeight: hp(3),
    textAlign: 'center',
  },
  telemetrySection: {
    padding: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: wp(3),
  },
  telemetryItem: {
    flex: 1,
  },
  telemetryLabel: {
    fontSize: fp(10),
    fontWeight: typography.fontWeight.semibold,
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: wp(2),
    textTransform: 'uppercase',
  },
  telemetryValueBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(2),
    padding: wp(3),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  telemetryValue: {
    fontSize: fp(14),
    fontWeight: typography.fontWeight.semibold,
    color: '#111827',
  },
  entityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    padding: wp(3),
    borderRadius: wp(2),
    marginBottom: wp(2),
    borderWidth: 1,
  },
  entityContent: {
    flex: 1,
  },
  entityLabel: {
    fontSize: fp(10),
    fontWeight: typography.fontWeight.semibold,
    color: '#6B7280',
    marginBottom: wp(0.5),
  },
  entityValue: {
    fontSize: fp(13),
    color: '#111827',
    fontWeight: typography.fontWeight.medium,
  },
  actionsContainer: {
    padding: wp(4),
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: wp(3),
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: wp(4),
    backgroundColor: '#FEF2F2',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#FEF2F2',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: wp(4),
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: fp(16),
    fontWeight: typography.fontWeight.semibold,
  },
  actionTextWhite: {
    fontSize: fp(16),
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: wp(4),
    backgroundColor: '#F9FAFB',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  closeButtonText: {
    fontSize: fp(16),
    fontWeight: typography.fontWeight.semibold,
    color: '#6B7280',
  },
  shareOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  shareContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    padding: wp(6),
    paddingBottom: hp(4),
  },
  shareTitle: {
    fontSize: fp(18),
    fontWeight: typography.fontWeight.bold,
    color: '#111827',
    marginBottom: wp(6),
    textAlign: 'center',
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: wp(4),
    paddingHorizontal: wp(5),
    marginBottom: wp(3),
    backgroundColor: '#F9FAFB',
    borderRadius: wp(3),
    gap: wp(4),
  },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareOptionText: {
    fontSize: fp(16),
    fontWeight: typography.fontWeight.medium,
    color: '#111827',
  },
  shareCancel: {
    marginTop: wp(2),
    paddingVertical: wp(4),
    alignItems: 'center',
  },
  shareCancelText: {
    fontSize: fp(16),
    fontWeight: typography.fontWeight.semibold,
    color: '#9CA3AF',
  },
});

export default AnalysisDetailModal;
