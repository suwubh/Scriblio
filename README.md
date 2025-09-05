Overview
🎨 Scriblio is a real‑time collaborative whiteboard using CRDTs (Yjs) for conflict‑free multi‑user editing, hybrid WebRTC/WebSocket transport, and Redis for presence/pub‑sub, plus an AI command palette for diagramming and summaries.

⚡ Built with React + TypeScript on Vite for fast local dev, HMR, and optimized production builds.

Demo
🚀 Live demo: Coming soon...
🧪 Local tryout: follow the quick start below to run with Vite’s dev server and HMR.

Features
🤝 Real‑time collaboration with Yjs CRDTs: eventual consistency, shared undo/redo, conflict‑free element sync.
📡 Hybrid transport: WebRTC data channels for low‑latency P2P sync, with WebSockets/Redis for signaling, presence, and fallback.
👥 Presence and remote cursors via Redis pub/sub for lightweight awareness and horizontal scale.
🧠 AI command palette: generate diagrams, canvas summaries, and inline text‑to‑image with smart auto‑layout (document supported commands here).
🕘 Session replay & versioning plus one‑click exports to PNG/PDF/JSON for shareable artifacts and auditability.

Tech stack
🧩 Frontend: React, TypeScript, Vite (HMR, fast builds).
🪢 Collaboration: Yjs (CRDT), y‑webrtc / WebRTC data channels, WebSockets.
🧷 Realtime infra: Redis (pub/sub) for presence, fan‑out, and room signaling.
🛠️ Dev/build: Vite CLI and scripts (dev/build/preview).

Architecture
🗺️ Client keeps a Yjs document for the canvas, syncing updates over WebRTC data channels when available and using WebSockets/Redis for signaling and robustness.
📣 Presence and room awareness are broadcast via Redis pub/sub channels to decouple publishers and subscribers and simplify horizontal scaling.
🏗️ The frontend runs on Vite for fast iteration; production assets are served by a static host or edge CDN.

Getting started
Prereqs: Node.js and npm; a Redis instance for presence/signaling.

Install: clone the repo, change into the directory, and run npm install following typical Vite workflows.

Env: copy .env.example to .env.local; set REDIS_URL and any AI provider keys (client vars must be prefixed with VITE_).

Dev: npm run dev to start the Vite server with HMR; open the printed localhost URL.

Build/preview: npm run build, then npm run preview to verify the production build locally.

Environment
🔐 Use .env.local with Vite’s env conventions (VITE_* for client exposure; keep secrets on the server).
🔧 Examples: VITE_APP_NAME, REDIS_URL, and AI_API_KEY per deployment model and security needs.

Scripts
▶️ npm run dev — start Vite dev server with HMR for local development.
🏗️ npm run build — create an optimized production build.
🔍 npm run preview — serve the built app locally for verification.

Docker (optional)
🐳 Add docker‑compose.yml for a redis service and the app; wire REDIS_URL via env for presence/signaling channels.
📦 Use a multi‑stage Dockerfile to build with Vite and serve statics via a lightweight server or hosting platform.

Usage
🖱️ Create or join a canvas; see remote cursors and edits in real time as Yjs syncs operations conflict‑free across peers.
✨ Use the AI palette to generate diagrams, summarize canvases, and insert text‑to‑image with auto‑layout (add prompt examples here).
📤 Export canvases as PNG/PDF/JSON, and review session replay/version history to track decisions and changes.

Structure
📂 Typical Vite + React + TS layout: src/ for components/state/hooks, public/ for assets; add modules for collaboration providers and presence logic.
🧭 Keep presence, transport, and AI integrations modular for easier testing and future upgrades.

Contributing
🤝 Contributions welcome: open issues, fork, and submit PRs; keep the README updated to match code changes.
📝 Consider a CONTRIBUTING.md for coding standards, commit messages, and review workflows to streamline collaboration.

Roadmap
🔐 Auth and team canvases with invite links and role‑based permissions.
💬 Persistent history, comments/mentions, notifications, and optional email/webhook integrations.
🧠 More AI actions: auto‑layout improvements, diagram refactoring, and domain‑specific templates.

Acknowledgements
🧮 Yjs CRDTs for real‑time collaboration and shared types across clients.
🌐 WebRTC data channels for low‑latency peer‑to‑peer transport.
📣 Redis pub/sub for presence, fan‑out, and signaling.
⚙️ Built with Vite for fast development and optimized builds.
