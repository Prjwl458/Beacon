import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { logHookState } from '../utils/debugLogger';
import { typography } from '../styles/beaconTheme';
import { AnalysisDetailModal } from '../components/AnalysisDetailModal';
import { wp, hp, fp } from '../utils/responsive';

// ─── Design System ────────────────────────────────────────────────────────────
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
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  border: '#F3F4F6',
  mono: '#1F2937',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

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
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const getRiskLevel = (score) => {
  if (score >= 70) return { label: 'CRITICAL THREAT', icon: 'shield-alert', color: COLORS.danger, bg: COLORS.dangerBg };
  if (score >= 40) return { label: 'SUSPICIOUS', icon: 'alert', color: COLORS.warning, bg: COLORS.warningBg };
  return { label: 'SAFE TRANSACTION', icon: 'shield-check', color: COLORS.success, bg: COLORS.successBg };
};

const truncateText = (text, maxLength = 60) => {
  if (!text) return 'No preview';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const formatLatency = (latency) => {
  if (!latency) return '--ms';
  return `${latency}ms`;
};

// ─── Dossier Entry Card ───────────────────────────────────────────────────────
const DossierEntry = ({ item, onPress }) => {
  const risk = getRiskLevel(item.riskScore);
  const isHighRisk = item.riskScore >= 70;

  return (
    <TouchableOpacity
      style={styles.dossierCard}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Left: Status Icon - 40px Circle */}
      <View style={[styles.statusIconContainer, { backgroundColor: risk.bg }]}>
        <MaterialCommunityIcons
          name={risk.icon}
          size={22}
          color={risk.color}
        />
      </View>

      {/* Center: Content */}
      <View style={styles.dossierContent}>
        {/* Header Line: Bold Title + Timestamp */}
        <View style={styles.dossierHeader}>
          <Text style={[styles.dossierTitle, { color: risk.color }]}>
            {risk.label}
          </Text>
          <Text style={styles.dossierTimestamp}>• {formatTimestamp(item.timestamp)}</Text>
        </View>

        {/* Data Preview: Mono-spaced, max-width */}
        <Text style={styles.dossierPreview} numberOfLines={2}>
          {truncateText(item.originalText)}
        </Text>

        {/* Telemetry Bar: Small, subtle gray text */}
        <View style={styles.telemetryBar}>
          <Text style={styles.telemetryText}>
            Score: {item.riskScore ?? '--'}%
          </Text>
          <Text style={styles.telemetryDivider}>|</Text>
          <Text style={styles.telemetryText}>
            {formatLatency(item.latency_ms)}
          </Text>
          {item.upiIds?.length > 0 && (
            <>
              <Text style={styles.telemetryDivider}>|</Text>
              <View style={styles.telemetryTag}>
                <Text style={styles.telemetryTagText}>UPI</Text>
              </View>
            </>
          )}
          {item.bankNames?.length > 0 && (
            <>
              <Text style={styles.telemetryDivider}>|</Text>
              <View style={styles.telemetryTag}>
                <Text style={styles.telemetryTagText}>BANK</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Right: Chevron */}
      <View style={styles.chevronContainer}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={COLORS.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <MaterialCommunityIcons name="shield-check" size={56} color={COLORS.textMuted} />
    </View>
    <Text style={styles.emptyTitle}>No scans yet</Text>
    <Text style={styles.emptySubtitle}>
      Analyze suspicious SMS messages to see them here
    </Text>
  </View>
);

// ─── HistoryScreen ────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const router = useRouter();
  const { history, getHistory, clearHistory, count } = useAnalysisHistory();
  const [selectedItem, setSelectedItem] = useState(null);

  const historyData = getHistory();

  const handleClearAll = () => {
    if (historyData.length === 0) return;
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            logHookState('HistoryScreen', 'clearHistory', 'all');
            // Navigate back to trigger home screen refresh
            router.back();
          },
        },
      ]
    );
  };

  const handleCardPress = (item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statsLeft}>
          <MaterialCommunityIcons name="clipboard-list" size={18} color={COLORS.textSecondary} />
          <Text style={styles.statsText}>
            {count} {count === 1 ? 'scan' : 'scans'} logged
          </Text>
        </View>
        {count > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButtonContainer}>
            <MaterialCommunityIcons name="delete-outline" size={18} color={COLORS.danger} />
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECENT SCANS</Text>
        <View style={styles.sectionLine} />
      </View>

      {/* List */}
      <FlatList
        data={historyData}
        renderItem={({ item }) => (
          <DossierEntry item={item} onPress={handleCardPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Detail Modal */}
      <AnalysisDetailModal
        visible={!!selectedItem}
        item={selectedItem}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  statsText: {
    fontSize: fp(13),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  clearButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.5),
  },
  clearButton: {
    fontSize: fp(13),
    color: COLORS.danger,
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  sectionTitle: {
    fontSize: fp(11),
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: wp(1),
  },
  sectionLine: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // List
  listContent: {
    padding: wp(4),
    flexGrow: 1,
  },
  separator: {
    height: wp(2),
  },

  // Dossier Card
  dossierCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: wp(4),
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
  },
  dossierContent: {
    flex: 1,
  },
  dossierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp(1),
  },
  dossierTitle: {
    fontSize: fp(13),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dossierTimestamp: {
    fontSize: fp(11),
    color: COLORS.textMuted,
    marginLeft: wp(2),
  },
  dossierPreview: {
    fontSize: fp(13),
    color: COLORS.mono,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    lineHeight: 18,
    marginBottom: wp(2),
  },
  telemetryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  telemetryText: {
    fontSize: fp(11),
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  telemetryDivider: {
    fontSize: fp(11),
    color: COLORS.border,
    fontWeight: '300',
  },
  telemetryTag: {
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: wp(2),
    paddingVertical: 2,
    borderRadius: 4,
  },
  telemetryTagText: {
    fontSize: fp(9),
    color: COLORS.warning,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chevronContainer: {
    paddingLeft: wp(2),
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(8),
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: wp(4),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: wp(1),
  },
  emptySubtitle: {
    fontSize: fp(13),
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: wp(6),
    lineHeight: 20,
  },
});
