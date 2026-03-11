# BEACON

AI-powered phishing detection for mobile messages.

**Version:** v1.2.0 &nbsp;|&nbsp; **Platform:** Android (Expo Managed Workflow)

---

## Overview

Beacon is a production-grade mobile cybersecurity application that detects phishing messages using an AI-powered backend. It analyzes suspicious text in real-time, extracting evidence such as malicious links, fraudulent UPI IDs, and suspicious patterns. Built with React Native and Expo SDK 54, Beacon provides users with clear risk assessments and actionable intelligence to protect themselves from digital threats.

Designed for individuals who receive suspicious messages and want a quick, reliable way to verify their authenticity before taking action.

---

## Features

- **Clipboard-First Analysis** — Paste any suspicious text to analyze instantly
- **AI Phishing Detection** — Backend powered by machine learning models
- **Risk Score Display** — Clear 0-100 score with color-coded threat levels
- **Evidence Extraction** — Automatically extracts links, UPI IDs, and bank accounts
- **Scan History** — Local storage of all analyses with detailed view
- **Share Results** — Share analysis via WhatsApp or copy to clipboard
- **Server Status Awareness** — Real-time indicator with 30s auto-check
- **Auto Wake-Up** — OFFLINE state automatically triggers server wake-up
- **Server Gate Logic** — Blocks analysis when server unavailable (prevents errors)
- **Premium UI** — Clean, responsive design that scales across all device sizes


---

## Screenshots
![ Image 2026-03-11 at 20 01 01](https://github.com/user-attachments/assets/d78d2351-a09d-40e0-b347-07bd18214607)


---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React Native 0.81.5 | Native mobile UI layer |
| Expo SDK 54.0.0 | Development framework & build system |
| Expo Router 6.0.23 | File-based navigation |
| Axios 1.7.0 | HTTP client for API communication |
| AsyncStorage 2.2.0 | Local data persistence |
| expo-av 16.0.8 | Video playback (About screen) |
| expo-clipboard 8.0.8 | Clipboard access |
| expo-linear-gradient ~15.0.8 | Gradient backgrounds |

---

## Architecture

Beacon follows a layered architecture pattern:

```
App Entry → Navigation → Context → Hooks → Services → Backend
```

- **Navigation:** Expo Router file-based routing (`app/` directory)
- **Context:** Server state management with 30-second periodic status checks
- **Hooks:** Business logic encapsulated in custom React hooks
- **Services:** API communication layer with Axios singleton
- **Backend:** FastAPI server hosted on Render (cold-start aware)

**Server State Machine:**
- `OFFLINE` → Server unreachable, auto-triggers wakeUp() on analysis
- `WAKING_UP` → Cold start in progress (120s timeout)
- `LIVE` → Server ready for analysis

For complete architecture details, see [docs/architecture_context.md](docs/architecture_context.md).

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android emulator) or physical Android device

### Installation

```bash
# Clone the repository
cd Beacon

# Install dependencies
npm install
```

### Running the App

```bash
# Clear Metro cache and start development server
npx expo start -c

# Run on Android device/emulator
npx expo start --android

# Run on web browser
npx expo start --web
```

---

## Project Structure

```
Beacon/
├── app/                    # Expo Router navigation layer
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   ├── context/            # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── screens/            # Screen components
│   ├── services/           # API services
│   ├── styles/             # Theme & design tokens
│   └── utils/              # Helper functions
├── assets/                 # Static assets (images, videos)
├── docs/                   # Documentation
└── package.json            # Dependencies & scripts
```

---

## Security

Beacon is designed with privacy as a core principle:

- **No SMS Permissions** — The app does not request `READ_SMS` or `RECEIVE_SMS` permissions
- **Manual Input Only** — Users manually paste suspicious text; no automatic message interception
- **Local Storage** — Analysis history is stored locally on device using AsyncStorage
- **Secure API Communication** — All backend communication uses HTTPS with API key authentication

This privacy-first approach ensures that Beacon operates as a tool for user-initiated analysis rather than passive message monitoring.

---

## About

Beacon originated as a hackathon project and was refined into a production-ready cybersecurity tool. It demonstrates how AI can be leveraged to combat digital fraud through practical, user-friendly applications. The app is built and maintained with a focus on clean code, responsive design, and genuine utility for end users.

---

**Documentation:** [docs/architecture_context.md](docs/architecture_context.md)  
**License:** Private
