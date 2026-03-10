import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Linking,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../styles/beaconTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, fp, screenWidth } from '../utils/responsive';

// ─── Section Title Component ─────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

// ─── Info Card Component ─────────────────────────────────────────────────────
const InfoCard = ({ children, callout }) => (
  <View style={styles.infoCard}>
    {children}
    {callout && (
      <View style={styles.callout}>
        <Text style={styles.calloutText}>{callout}</Text>
      </View>
    )}
  </View>
);

// ─── About Screen Component ──────────────────────────────────────────────────
const AboutScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleOpenGitHub = async () => {
    const url = 'https://github.com/Prjwl458/Beacon';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening GitHub:', error);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: ABOUT BEACON */}
          <View style={styles.section}>
            <View style={styles.logoContainer}>
              <Video
                source={require('../../assets/Beacon-logo-video.mp4')}
                style={styles.logoVideo}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
                isMuted={true}
                useNativeControls={false}
              />
              <LinearGradient
                colors={['transparent', '#F2F4F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.logoFade}
                pointerEvents="none"
              />
            </View>
          </View>

          {/* SECTION 2: WHAT IT DOES */}
          <View style={styles.section}>
            <SectionTitle>WHAT IT DOES</SectionTitle>
            <InfoCard
              callout="The home screen shows a live pulse indicator so you always know if the server is ready before you run an analysis."
            >
              <Text style={styles.bodyText}>
                Beacon scans messages for phishing threats using an AI-powered
                backend. Paste any suspicious text — Beacon analyzes it instantly
                and tells you whether it's safe or a threat, with a risk score
                and reasoning.
              </Text>
            </InfoCard>
          </View>

          {/* SECTION 3: THE STORY */}
          <View style={styles.section}>
            <SectionTitle>THE STORY</SectionTitle>
            <InfoCard>
              <Text style={styles.bodyText}>
                Beacon started as a hackathon project built around a phishing
                detection API. But once the API was live, it made sense to build
                something real around it — an app that actually puts it to use.
                That's what Beacon is.
              </Text>
            </InfoCard>
          </View>

          {/* SECTION 4: CREATOR */}
          <View style={styles.section}>
            <SectionTitle>MADE BY</SectionTitle>
            <View style={styles.creatorCard}>
              <Text style={styles.creatorName}>Prajwal</Text>
              <View style={styles.creatorDivider} />
              <Text style={styles.creatorLine}>
                Building tools that are actually useful.
              </Text>
              <TouchableOpacity
                style={styles.githubButton}
                onPress={handleOpenGitHub}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="github"
                  size={16}
                  color={colors.textMuted}
                />
                <Text style={styles.githubButtonText}>GitHub</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Made with care.</Text>
          </View>

          {/* Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>v1.2.0</Text>
          </View>

          {/* Bottom Padding */}
          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },

  // Section
  section: {
    marginBottom: wp(4),
  },
  logoContainer: {
    width: screenWidth - wp(8),
    height: (screenWidth - wp(8)) * (9 / 16),
    alignSelf: 'center',
    overflow: 'hidden',
  },
  logoVideo: {
    width: '100%',
    height: '100%',
  },
  logoFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(5),
  },
  sectionTitle: {
    fontSize: fp(11),
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: wp(4),
  },

  // Info Cards
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: wp(4),
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 1,
  },
  bodyText: {
    fontSize: fp(15),
    fontWeight: typography.fontWeight.regular,
    color: colors.textPrimary,
    lineHeight: hp(3),
    textAlign: 'left',
  },

  // Callout Box
  callout: {
    marginTop: wp(4),
    paddingTop: wp(2),
    paddingLeft: wp(2),
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    backgroundColor: colors.surfaceLight,
    paddingRight: wp(2),
    paddingBottom: wp(2),
    borderRadius: borderRadius.sm,
  },
  calloutText: {
    fontSize: fp(13),
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: hp(2.5),
    fontStyle: 'italic',
  },

  // Creator Card
  creatorCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: wp(4),
    alignItems: 'center',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 1,
  },
  creatorName: {
    fontSize: fp(28),
    fontWeight: typography.fontWeight.extrabold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: wp(4),
  },
  creatorDivider: {
    width: 32,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    marginVertical: wp(4),
  },
  creatorLine: {
    fontSize: fp(13),
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: wp(4),
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    paddingHorizontal: wp(4),
    paddingVertical: wp(2),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
  githubButtonText: {
    fontSize: fp(13),
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
  },

  // Footer
  footer: {
    marginTop: wp(4),
    alignItems: 'center',
    paddingBottom: wp(4),
  },
  footerText: {
    fontSize: fp(12),
    fontWeight: typography.fontWeight.regular,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  versionContainer: {
    marginTop: wp(4),
    alignItems: 'center',
    paddingBottom: wp(4),
  },
  versionText: {
    fontSize: fp(11),
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
    letterSpacing: 1,
  },
});

export default AboutScreen;
