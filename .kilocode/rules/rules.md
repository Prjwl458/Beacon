# rules.md
follow these rules neatly
## Guidelines
That is a smart move. Adding "Self-Documentation" directly into the rules.md ensures that Kilo Code doesn't just write code and forget—it creates a trail for your "technical stamina" to follow later.

Here is the updated, clean text for your rules.md. I have added a new section: 📜 Documentation & Context Management.

Project Rules: Agentic Honeypot Mobile (Expo)
 Architectural Principles
Reliability First: Every API call must include a timeout (10s default) and a robust try-catch block to handle network instability.

State Management: Use a "Server Context" or global state to track if the Render instance is OFFLINE, WAKING_UP, or LIVE.

Logic Isolation: Keep all API logic inside src/services/api.js. Screens should only call these services; do not hardcode URLs or API keys in UI components.

 Backend Integration (FastAPI/Render)
Base URL: https://hackthoan-honeypot-agentic.onrender.com

Authentication: Always include the header x-api-key: prajwal_hackathon_key_2310.

Wake-up Protocol: Before allowing any analysis, the app must perform a GET request to the base URL to trigger the Render spin-up.

Rate Limiting: Gracefully handle 429 Too Many Requests by implementing a 5-second cooldown in the UI.

 Documentation & Context Management
Architecture Log: Maintain a file named architecture_context.md in the root directory.

Post-Task Summary: After every significant task or file creation, append a summary to architecture_context.md including:

Files Modified/Created: List of filenames.

Logic Implemented: Brief technical explanation (e.g., "Implemented Axios interceptor").

State Changes: Any new context variables or hooks added.

Next Step: The logical next technical milestone.

Context7 Usage: Use Context7 to read architecture_context.md before starting a new task to maintain continuity.

 Expo & UI Standards
Framework: Expo SDK (Managed Workflow).

Styling: Use Tailwind (NativeWind) or standard StyleSheet for a professional interface.

Feedback: Always show a Loading..., Waking Server..., or Analyzing... state.

Data Structure: Parse and display Risk Score, UPI ID, and Bank Name clearly.

MCP Interaction Guidelines (Kilo Code)
Sequential Thinking: Use this to plan complex logic before writing files.

File System: Use this to create a modular structure: /components, /services, /hooks, and /context.