# Beacon Architecture Context

## Version 1.2.2 — March 2026

---

## 1. PROJECT SUMMARY

**Beacon** is a production-grade mobile cybersecurity application that detects phishing messages using an AI-powered backend. Built with Expo SDK 54 and React Native, it provides users with real-time analysis of suspicious messages, extracting evidence such as malicious links, fraudulent UPI IDs, and suspicious patterns.

| Attribute | Value |
|-----------|-------|
| **Name** | Beacon |
| **Version** | 1.2.2 |
| **Platform** | iOS + Android (Expo Managed Workflow) |
| **Framework** | React Native 0.81.5 |
| **Router** | Expo Router v6 (file-based navigation) |
| **Backend** | `https://hackthoan-honeypot-agentic.onrender.com` |
| **State** | Feature-complete core, UI polish phase |

---

## 2. DIRECTORY STRUCTURE

```
D:\Projects\Beacon\
│
├── 📄 Configuration Files
│   ├── package.json              # Dependencies & npm scripts
│   ├── app.json                  # Expo configuration (name, icons, permissions)
│   ├── babel.config.js           # Babel preset for Expo
│   └── QWEN.md                   # Project identity & developer guidelines
│
├── 📂 app/                        # Expo Router navigation layer
│   ├── _layout.js                # Root layout: ErrorBoundary + ServerProvider + Stack
│   ├── index.js                  # Home screen route (exports BeaconHomeScreen)
│   ├── history.js                # History screen route (exports HistoryScreen)
│   ├── about.js                  # About screen route (exports AboutScreen)
│   └── splash.js                 # Splash screen route (exports SplashScreen)
│
├── 📂 src/                        # Source code
│   ├── components/               # Reusable UI components
│   │   ├── AnalysisDetailModal.js # Premium bottom sheet for history details
│   │   ├── ErrorBoundary.js      # React error boundary with fallback UI
│   │   └── Toast.js              # Auto-dismissing toast notifications
│   │
│   ├── context/                  # React Context providers
│   │   └── ServerContext.js      # Server state management (OFFLINE/WAKING_UP/LIVE)
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useSmsAnalyzer.js     # Message analysis logic with server wake-up
│   │   └── useAnalysisHistory.js # History state management with AsyncStorage
│   │
│   ├── screens/                  # Screen components
│   │   ├── BeaconHomeScreen.js   # Main analysis screen (v1.2.2)
│   │   ├── HistoryScreen.js      # Analysis history view
│   │   ├── AboutScreen.js        # About page with video logo
│   │   └── SplashScreen.js       # App launch screen with animation
│   │
│   ├── services/                 # API & external services
│   │   └── api.js                # Axios singleton (wakeUpServer, analyzeMessage)
│   │
│   ├── styles/                   # Theme & styling
│   │   ├── beaconTheme.js        # v1.2.2 design tokens (colors, spacing, typography)
│   │   └── theme.js              # Legacy theme (deprecated, use beaconTheme)
│   │
│   ├── utils/                    # Helper functions
│   │   ├── responsive.js         # Responsive utilities (wp, hp, fp)
│   │   ├── session.js            # Session/sender ID generation
│   │   └── debugLogger.js        # Debug logging utilities
│   │
│   └── _layout.js                # Legacy layout (unused, kept for compatibility)
│
├── 📂 assets/                     # Static assets
│   ├── icon.png                  # App icon (1024×1024)
│   ├── splash-icon.png           # Splash screen icon
│   ├── adaptive-icon.png         # Android adaptive icon foreground
│   ├── favicon.png               # Web favicon
│   ├── Beacon-logo-video.mp4     # Animated logo video for About screen
│   └── [other images]            # Logo variants, decorative assets
│
├── 📂 docs/                       # Documentation
│   └── architecture_context.md   # This file — architecture & implementation details
│
└── 📂 .expo/                      # Expo CLI cache & config (auto-generated)
    ├── devices.json
    ├── settings.json
    └── README.md
```

### Deleted Files (No Longer Exist):
- ❌ `src/screens/HomeScreen.js` — Legacy screen, replaced by BeaconHomeScreen
- ❌ `src/hooks/useBatchAnalyzer.js` — Unused hook
- ❌ `src/components/AnalysisModal.js` — Replaced by AnalysisDetailModal
- ❌ `src/index.js` — Unused re-export file
- ❌ `app/smspicker.js` — SMS picker route (permissions removed)
- ❌ `src/components/SmsInboxModal.js` — SMS picker modal
- ❌ `src/services/smsNativeService.js` — Native SMS service
- ❌ `src/utils/smsLoader.js` — SMS loader utilities
- ❌ `src/screens/SmsPickerScreen.js` — SMS picker screen

---

## 3. ARCHITECTURE LAYERS

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APP ENTRY (app/_layout.js)                          │
│  ┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │ ErrorBoundary   │  │   ServerProvider   │  │   Stack Navigator      │  │
│  │                 │◄─┤ • serverStatus     │  │                         │  │
│  │ Catches React   │  │ • sessionId        │  │  • splash → index →     │  │
│  │ runtime errors  │  │ • wakeUp()         │  │    history → about      │  │
│  │                 │  │ • isServerReady    │  │                         │  │
│  └─────────────────┘  └──────────┬──────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NAVIGATION FLOW                                    │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   Splash    │────►│    Home     │◄───►│   History   │                   │
│  │  Screen     │     │   Screen    │     │   Screen    │                   │
│  │             │     │             │     │             │                   │
│  │ • Animated  │     │ • Server    │     │ • FlatList  │                   │
│  │   Logo      │     │   Control   │     │   History   │                   │
│  │ • Progress  │     │ • Analysis  │     │ • Detail    │                   │
│  │   Bar       │     │   Modal     │     │   Modal     │                   │
│  └─────────────┘     └──────┬──────┘     └─────────────┘                   │
│                             │                                               │
│                             └───► About Screen                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTEXT LAYER                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              src/context/ServerContext.js                           │   │
│  │                                                                     │   │
│  │  Server States: OFFLINE → WAKING_UP → LIVE                         │   │
│  │                                                                     │   │
│  │  Context Value:                                                     │   │
│  │  • serverStatus: string (OFFLINE\|WAKING_UP\|LIVE)                  │   │
│  │  • sessionId: string (persists across navigation)                  │   │
│  │  • error: string \| null                                            │   │
│  │  • lastChecked: Date \| null                                        │   │
│  │  • isServerReady: boolean                                          │   │
│  │  • isTransitioning: boolean                                         │   │
│  │  • wakeUp(): Promise<boolean>                                      │   │
│  │  • checkStatus(): Promise<boolean>                                 │   │
│  │  • resetServer(): void                                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Provides
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HOOKS LAYER                                       │
│                                                                             │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐      │
│  │   src/hooks/                 │    │   src/hooks/                 │      │
│  │   useSmsAnalyzer.js         │    │   useAnalysisHistory.js     │      │
│  │                              │    │                              │      │
│  │  • processMessage(smsBody)   │    │  • history: Object[]        │      │
│  │  • isAnalyzing: boolean      │    │  • addToHistory(result,    │      │
│  │  • analysisResult: Object    │    │         text, senderId)     │      │
│  │  • error: string \| null      │    │  • isDuplicate(text, sid)  │      │
│  │  • isServerReady             │    │  • clearHistory()          │      │
│  │  • serverStatus              │    │  • count: number           │      │
│  │                              │    │                              │      │
│  │  Uses:                       │    │  Uses:                       │      │
│  │  • useServer (sessionId)    │    │  • useState + useCallback   │      │
│  │  • useAnalysisHistory        │    │  • MAX_HISTORY_SIZE = 100   │      │
│  │  • createMessagePayload      │    │                              │      │
│  └──────────────┬───────────────┘    └──────────────────────────────┘      │
│                 │                                                            │
│                 │ Updates                                                    │
│                 ▼                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Uses
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    src/services/api.js                              │   │
│  │  Axios Singleton                                                    │   │
│  │  • baseURL: https://hackthoan-honeypot-agentic.onrender.com        │   │
│  │  • headers: { x-api-key: prajwal_hackathon_key_2310 }              │   │
│  │  • timeout: 20000ms                                                │   │
│  │  • Interceptor: 429 rate limit retry (5000ms)                     │   │
│  │                                                                     │   │
│  │  Exported Functions:                                                │   │
│  │  • wakeUpServer() → triggers Render cold-start                     │   │
│  │  • analyzeMessage(payload) → POST /message                         │   │
│  │  • checkServerStatus() → GET / (health check)                     │   │
│  │  • reportThreat(data) → POST /report                              │   │
│  │  • validateConnection() → GET / (pulse check)                     │   │
│  │  • isPulseValid() → checks last pulse timestamp                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Uses
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UTILITIES LAYER                                   │
│                                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐      │
│  │ responsive.js   │ │ session.js      │ │ debugLogger.js          │      │
│  │                 │ │                 │ │                         │      │
│  │ • wp(percent)   │ │ • generate-     │ │ • logServerStatus-      │      │
│  │ • hp(percent)   │ │   SessionId()   │ │   Change()             │      │
│  │ • fp(size)      │ │ • generate-     │ │ • logAnalysisRequest()  │      │
│  │ • screenWidth   │ │   SenderId()    │ │ • logAnalysisResult()   │      │
│  │ • screenHeight  │ │ • createMes-    │ │ • logError()            │      │
│  │                 │ │   sagePayload() │ │ • logHookState()        │      │
│  │                 │ │ • validate-     │ │                         │      │
│  │                 │ │   SessionId()   │ │                         │      │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Interacts
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENTS LAYER                                    │
│                                                                             │
│  ┌─────────────────────┐              ┌─────────────────────────┐          │
│  │ AnalysisDetailModal │              │ Toast                   │          │
│  │                     │              │                         │          │
│  │ • Premium bottom    │              │ • Auto-dismiss (2s)    │          │
│  │   sheet             │              │ • Type: success\|error  │          │
│  │ • Risk score display│              │ • Animated opacity     │          │
│  │ • Extracted entities│              │                         │          │
│  │ • Share options     │              └─────────────────────────┘          │
│  │ • Report scam CTA   │                                                  │
│  └─────────────────────┘              ┌─────────────────────────┐          │
│                                       │ ErrorBoundary           │          │
│                                       │                         │          │
│                                       │ • componentDidCatch    │          │
│                                       │ • Fallback: System     │          │
│                                       │   Malfunction screen   │          │
│                                       └─────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Sends data
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND (Render)                               │
│                                                                             │
│  https://hackthoan-honeypot-agentic.onrender.com                           │
│                                                                             │
│  Endpoints:                                                                 │
│  • GET /          → Health check, triggers wake-up                         │
│  • POST /message  → Phishing detection (v1.2.2)                            │
│  • POST /report   → Report threat to database                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Relationships

| From | To | Relationship |
|------|-----|-------------|
| `app/_layout.js` | `ServerContext.js` | Wraps app, provides server status & sessionId |
| `SplashScreen` | `ServerContext` | SessionId generated on mount |
| `BeaconHomeScreen` | `useSmsAnalyzer` | Uses for message analysis |
| `useSmsAnalyzer` | `ServerContext` | Gets `sessionId`, `isServerReady`, `wakeUp()` |
| `useSmsAnalyzer` | `useAnalysisHistory` | Adds results, checks duplicates |
| `useSmsAnalyzer` | `api.js` | Calls `analyzeMessage()` |
| `HistoryScreen` | `useAnalysisHistory` | Displays past analyses |
| `AnalysisDetailModal` | Item prop | Displays analysis result details |
| `Toast` | Inline | Provides user feedback |

---

## 4. DESIGN SYSTEM

### Color Tokens (beaconTheme.js)

```javascript
export const colors = {
  // Backgrounds
  background: '#F7F8FA',      // Light gray-blue app background
  surface: '#FFFFFF',          // Pure white cards/surfaces
  surfaceLight: '#F1F3F4',    // Light gray for subtle elements

  // Primary - Amber
  primary: '#FFB800',          // Main brand color (amber)
  primaryDark: '#E6A600',      // Darker amber for hover/active
  primaryLight: '#FFD04D',    // Lighter amber for highlights

  // Status Colors
  success: '#00C853',          // Green for safe/secure states
  successLight: '#E8F9EF',    // Light green background
  successText: '#00A844',      // Dark green text
  warning: '#FF9100',          // Orange for warnings
  danger: '#FF1744',           // Red for threats/errors
  dangerLight: '#FFEBEE',      // Light red background

  // Text
  textPrimary: '#111111',      // Near black primary text
  textSecondary: '#5F6368',    // Gray secondary text
  textMuted: '#9AA0A6',        // Light gray muted text

  // Borders
  border: '#EBEBEB',           // Light gray borders
  borderLight: '#F4F4F4',      // Very light gray borders

  // Special
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.05)',
  secureBadge: '#E8F9EF',
  secureBadgeText: '#00A844',
};
```

### Typography

```javascript
export const typography = {
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    display: 36,
  },
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};
```

### Spacing

```javascript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
```

### Border Radius

```javascript
export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};
```

### Shadows

```javascript
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
};
```

---

## 5. KEY FEATURES (v1.2.2)

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Clipboard-First Analysis** | Users paste suspicious text to analyze | ✅ Active |
| **AI Phishing Detection** | Backend analyzes messages for threats | ✅ Active |
| **Risk Score Display** | 0-100 score with color coding | ✅ Active |
| **Evidence Extraction** | Extracts links, UPI IDs, bank accounts | ✅ Active |
| **Scan History** | Local storage of all analyses | ✅ Active |
| **Share Analysis** | WhatsApp share & clipboard copy | ✅ Active |
| **Server Status Awareness** | OFFLINE/WAKING_UP/LIVE states with 30s auto-check | ✅ Active |
| **Server Gate Logic** | Blocks analysis when server unavailable (>3 words) | ✅ Active |
| **Auto Wake-Up** | OFFLINE state auto-triggers server wake-up | ✅ Active |
| **About Page** | App info with animated video logo | ✅ Active |

### Removed Features

| Feature | Reason | Status |
|---------|--------|--------|
| SMS Permissions | Privacy-focused design | ❌ Removed |
| Passive SMS Listening | Requires native build | ❌ Removed |
| SMS Picker UI | No longer needed | ❌ Removed |
| Phone Number Detection | Unreliable backend field | ❌ Removed |
| Extracted Entities Count | Unreliable backend field | ❌ Removed |
| Fake Result Fallbacks | Never show fake/safe results | ❌ Removed |

---

## 6. CORE DEPENDENCIES

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~54.0.0 | Framework & build system |
| `expo-router` | ~6.0.23 | File-based navigation |
| `react` | 19.1.0 | UI library |
| `react-native` | 0.81.5 | Native layer |
| `axios` | ^1.7.0 | HTTP client for API calls |
| `expo-clipboard` | ~8.0.8 | Clipboard access |
| `expo-av` | ^16.0.8 | Video playback (About screen) |
| `expo-linear-gradient` | ~15.0.8 | Gradient backgrounds |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local storage |
| `@react-native-community/netinfo` | ^11.4.1 | Network connectivity |
| `react-native-safe-area-context` | ~5.6.0 | Safe area insets |
| `react-native-screens` | ~4.16.0 | Native screen optimization |
| `expo-constants` | ~18.0.13 | App constants |
| `expo-linking` | ~8.0.11 | Deep linking |
| `expo-haptics` | ~15.0.8 | Haptic feedback |
| `expo-status-bar` | ~3.0.9 | Status bar control |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@babel/core` | ^7.25.0 | Babel compiler |

---

## 7. API & BACKEND

### Backend Configuration

```javascript
const BASE_URL = 'https://hackthoan-honeypot-agentic.onrender.com';
const API_KEY = 'prajwal_hackathon_key_2310';
const TIMEOUT_MS = 20000;           // 20 seconds
const WAKEUP_TIMEOUT_MS = 120000;   // 120 seconds (cold start)
const RATE_LIMIT_COOLDOWN_MS = 5000; // 5 seconds
```

### Endpoints

| Method | Endpoint | Purpose | Timeout |
|--------|----------|---------|---------|
| `GET` | `/` | Health check & wake-up | 120s |
| `POST` | `/message` | Analyze message | 20s |
| `POST` | `/report` | Report threat | 20s |

### Request Structure (POST /message)

```javascript
{
  sessionId: "session_abc123",
  message: {
    sender: "user",
    text: "Your package is delayed. Verify here: http://...",
    timestamp: 1234567890,
  },
  metadata: {
    channel: "manual_entry",
    language: "English",
    locale: "IN",
  },
}
```

### Response Structure

```javascript
{
  status: "success",
  intelligence: {
    riskScore: 85,
    isPhishing: true,
    scamType: "Delivery Scam",
    urgencyLevel: "High",
    agentNotes: "High urgency language with suspicious link",
    phishingLinks: ["http://..."],
    upiIds: ["9876543210@upi"],
    bankAccounts: ["HDFC Bank"],
    phoneNumbers: ["+91..."],
    suspiciousKeywords: ["urgent", "verify"],
    extractedEntities: [...],
    latency_ms: 4603,
  },
  version: "1.2.2",
  timestamp: "2026-03-07T20:26:57.332845",
}
```

### Server State Machine

```
┌──────────────────────────────────────────┐
│           SERVER STATE MACHINE           │
└──────────────────────────────────────────┘

     ┌─────────┐
     │ OFFLINE │◄────────────────────────┐
     └────┬────┘                         │
          │ wakeUp()                     │ failure
          ▼                              │
     ┌─────────────┐                     │
     │ WAKING_UP   │─────────────────────┘
     └─────┬───────┘
           │ success
           ▼
     ┌─────────┐
     │  LIVE   │
     └─────────┘
```

| State | Description | UI Behavior |
|-------|-------------|-------------|
| `OFFLINE` | Server not reachable | Show "Server Offline" badge, auto-triggers wakeUp() on analysis |
| `WAKING_UP` | Cold start in progress | Show "Waking Up..." with loader |
| `LIVE` | Server ready | Show "Secure" badge, enable analysis |

### Periodic Status Check

Beacon automatically checks server status every 30 seconds in the background:

```javascript
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

  return () => clearInterval(interval);
}, []);
```

**Benefits:**
- Auto-recovers if server comes back online
- Silent operation (no user-facing errors)
- Cleans up properly on app unmount

### Server Gate Logic (Analysis Blocking)

Beacon implements a server gate to prevent analysis when the backend is unavailable:

```javascript
// Word count check
const wordCount = inputText.trim().split(/\s+/).length;
const isShortMessage = wordCount <= 3;

// Server gate - only for messages with more than 3 words
if (!isShortMessage) {
  if (serverStatus === 'OFFLINE') {
    showToast('Starting server, please wait and try again...', 'info');
    wakeUp();  // Auto-trigger wake-up
    return;
  }

  if (serverStatus === 'WAKING_UP') {
    showToast('Server is starting up. Please wait and try again.', 'error');
    return;
  }
}

// Proceed with analysis only if server is LIVE or message is short
```

| Message Length | Server Status | Behavior |
|----------------|---------------|----------|
| ≤3 words | Any | ✅ Analysis proceeds (quick check) |
| >3 words | OFFLINE | ⚠️ Auto-triggers wakeUp() + info toast |
| >3 words | WAKING_UP | ❌ Blocked + error toast |
| >3 words | LIVE | ✅ Analysis proceeds |

**Error Handling:**
- If API call fails mid-analysis, no result is shown (null state)
- Never returns fake/safe fallback results
- User sees error toast, must retry manually

---

## 8. RESPONSIVE SYSTEM

### Utility Functions (src/utils/responsive.js)

```javascript
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Width percentage
export const wp = (percent) => (width * percent) / 100;

// Height percentage
export const hp = (percent) => (height * percent) / 100;

// Font size scaling (base: 390px screen)
export const fp = (size) => Math.round((width / 390) * size);

export { width as screenWidth, height as screenHeight };
```

### How It Works

| Function | Formula | Use Case |
|----------|---------|----------|
| `wp(percent)` | `(width × percent) / 100` | Horizontal spacing, widths |
| `hp(percent)` | `(height × percent) / 100` | Vertical spacing, heights |
| `fp(size)` | `Math.round((width / 390) × size)` | Font sizes |

### Reference Conversion Guide

| Pixel Value | Responsive Equivalent |
|-------------|----------------------|
| `4px` | `wp(1)` or `hp(0.5)` |
| `8px` | `wp(2)` or `hp(1)` |
| `12px` | `wp(3)` |
| `16px` | `wp(4)` |
| `20px` | `wp(5)` |
| `24px` | `wp(6)` or `hp(3)` |
| `32px` | `wp(8)` or `hp(4)` |
| `40px` | `wp(10)` |
| `fontSize: 10` | `fp(10)` |
| `fontSize: 12` | `fp(12)` |
| `fontSize: 14` | `fp(14)` |
| `fontSize: 16` | `fp(16)` |
| `fontSize: 18` | `fp(18)` |
| `fontSize: 24` | `fp(24)` |
| `fontSize: 28` | `fp(28)` |

### Usage Example

```javascript
import { wp, hp, fp } from '../utils/responsive';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),      // 16px on 390px screen
    paddingVertical: hp(1),        // ~8px on most phones
  },
  text: {
    fontSize: fp(14),              // Scales with screen width
  },
  logo: {
    width: wp(40),                 // 40% of screen width
    height: wp(40),
  },
});
```

---

## 9. CODE STANDARDS

### JSDoc Requirements

**Every function must have a JSDoc comment:**

```javascript
/**
 * Analyze a message for phishing detection.
 * Uses the /message endpoint with HoneypotRequest schema.
 *
 * @param {Object} params - Analysis parameters
 * @param {string} params.sessionId - Session identifier
 * @param {Object} params.message - Message object with text, senderId, type
 * @param {Object} params.metadata - Metadata with channel
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<Object>} Analysis result from backend
 */
export const analyzeMessage = async (params, signal = null) => {
  // Implementation
};
```

### Theme Usage Rules

**✅ DO:**
```javascript
import { colors } from '../styles/beaconTheme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },
});
```

**❌ DON'T:**
```javascript
// Hardcoded hex values
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',  // ❌ Use colors.surface
  },
});

// Duplicate color constants
const COLORS = {
  bg: '#F8FAFC',  // ❌ Import from beaconTheme
};
```

### Hook/Service Separation Rules

**✅ DO:**
- Hooks manage UI state and call services
- Services handle all API communication
- Context provides global state

```javascript
// Hook (useSmsAnalyzer.js)
const processMessage = useCallback(async (smsBody) => {
  const result = await analyzeMessage(payload);  // Call service
  addToHistory(result, smsBody, senderId);       // Update state
  return result;
}, []);

// Service (api.js)
export const analyzeMessage = async (params, signal = null) => {
  const response = await apiClient.post('/message', payload, { signal });
  return response.data;
};
```

**❌ DON'T:**
- Call axios directly from screens
- Put API logic in components
- Skip error handling in hooks

### Signal/Bullet Point Generation (getSignals)

The `getSignals` function in `BeaconHomeScreen.js` generates bullet points from backend intelligence:

```javascript
const getSignals = (score, intel) => {
  // If no intelligence data, return empty array - never guess
  if (!intel) return [];

  const signals = [];

  // Manual extraction notice (if applicable)
  if (isManualExtraction) {
    signals.push({ icon: 'hand-back-left', label: 'Manual Extraction Used' });
  }

  // High risk signals
  if (score >= 70 || intel.isPhishing) {
    signals.push({ icon: 'alert-circle', label: 'Phishing Detected' });
    if (intel.scamType) signals.push({ icon: 'shield-alert', label: intel.scamType });
    if (intel.urgencyLevel === 'High') signals.push({ icon: 'alert', label: 'High Urgency' });
    if (intel.phishingLinks?.length > 0) signals.push({ icon: 'link-variant', label: 'N Suspicious Links' });
    if (intel.upiIds?.length > 0) signals.push({ icon: 'account-cash', label: 'N UPI IDs' });
    if (intel.bankAccounts?.length > 0) signals.push({ icon: 'bank', label: 'N Bank Accounts' });
    if (intel.suspiciousKeywords?.length > 0) signals.push({ icon: 'text-search', label: 'N Suspicious Keywords' });
    return signals;
  }

  // Medium risk signals
  if (score >= 30) {
    signals.push({ icon: 'alert', label: 'Suspicious Pattern' });
    // ... additional checks
    return signals;
  }

  // Low risk - return empty (never show "No Threats" guess)
  return [];
};
```

**Active Bullet Points:**

| Bullet | Source Field | Condition |
|--------|--------------|-----------|
| Manual Extraction Used | `isManualExtraction` | If agentNotes includes "manual extraction" |
| Phishing Detected | Hardcoded | If score >= 70 OR intel.isPhishing |
| [Scam Type] | `intel.scamType` | If exists |
| High/Medium Urgency | `intel.urgencyLevel` | If "High" or "Medium" |
| N Suspicious Links | `intel.phishingLinks.length` | If length > 0 |
| N UPI IDs | `intel.upiIds.length` | If length > 0 |
| N Bank Accounts | `intel.bankAccounts.length` | If length > 0 |
| N Suspicious Keywords | `intel.suspiciousKeywords.length` | If length > 0 |

**Removed Bullet Points (Unreliable):**

| Bullet | Source Field | Reason Removed |
|--------|--------------|----------------|
| N Phone Numbers | `intel.phoneNumbers.length` | Unreliable from backend |
| N Entities Extracted | `intel.extractedEntities.length` | Unreliable from backend |

**Key Principle:** Never guess or show fake bullet points. If intelligence is missing, show empty state.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `AnalysisDetailModal` |
| Hooks | camelCase with `use` prefix | `useSmsAnalyzer` |
| Constants | UPPER_SNAKE_CASE | `MAX_HISTORY_SIZE` |
| Files | PascalCase (components), camelCase (utils) | `ErrorBoundary.js`, `session.js` |
| Styles | camelCase | `scrollContent`, `videoFrame` |

### Import Order

```javascript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. React Native
import { View, Text, StyleSheet } from 'react-native';

// 3. Expo / Libraries
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// 4. Internal - Context
import { useServer } from '../context/ServerContext';

// 5. Internal - Hooks
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';

// 6. Internal - Services
import { analyzeMessage } from '../services/api';

// 7. Internal - Utils
import { wp, hp, fp } from '../utils/responsive';
```

---

## 10. SETUP & DEVELOPMENT

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Clear Metro cache and start
npx expo start -c

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios

# Run on web
npx expo start --web
```

### Project Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npx expo start -c` | Clear cache & start |
| `npx expo start --android` | Android device/emulator |
| `npx expo start --ios` | iOS simulator |
| `npx expo start --web` | Web browser |

---

## 11. SECURITY RULES

- ✅ API key stored in `api.js` (never exposed to UI)
- ✅ No `READ_SMS` or `RECEIVE_SMS` permissions
- ✅ Manual paste input only (privacy-first design)
- ✅ Session IDs generated per session
- ✅ History stored locally (AsyncStorage)
- ✅ No sensitive data in console logs (production)

---

## 12. FILE NAMING CONVENTIONS

| Location | Convention | Example |
|----------|------------|---------|
| `app/` | lowercase.js | `index.js`, `history.js` |
| `src/screens/` | PascalCase | `BeaconHomeScreen.js` |
| `src/components/` | PascalCase | `ErrorBoundary.js` |
| `src/hooks/` | camelCase with `use` | `useSmsAnalyzer.js` |
| `src/services/` | camelCase | `api.js` |
| `src/utils/` | camelCase | `responsive.js` |
| `src/styles/` | camelCase | `beaconTheme.js` |

---

## 13. CHANGELOG

### v1.2.2 (March 2026) — Current

**Added:**
- ✅ Responsive design system (wp, hp, fp)
- ✅ AnalysisDetailModal with share options
- ✅ About screen with animated video logo
- ✅ Server state awareness (OFFLINE/WAKING_UP/LIVE)
- ✅ Toast notifications
- ✅ ErrorBoundary with retry

**Removed:**
- ❌ SMS permissions (privacy-first)
- ❌ SMS picker UI
- ❌ Dead code (HomeScreen, AnalysisModal, useBatchAnalyzer)
- ❌ All console.log statements (production)

**Changed:**
- 🔄 Slug: `beacon-cybersecurity` → `beacon`
- 🔄 Splash background: `#121212` → `#FFFFFF`
- 🔄 All screens converted to responsive units

---

**Last Updated:** March 10, 2026  
**Maintained By:** Development Team  
**Status:** Production-Ready
