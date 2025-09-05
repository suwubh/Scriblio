Scriblio

Overview

🎨 Scriblio is a collaborative whiteboard that blends real-time CRDT-based editing (Yjs) with hybrid transport (WebRTC + WebSockets) and Redis-powered presence/pub-sub. It also includes an AI command palette for generating diagrams, summaries, and images right inside the canvas.

⚡ Built with React + TypeScript + Vite for instant HMR, smooth local development, and optimized production builds.

Demo

🚀 Live demo: Coming soon
🧪 Local tryout: See the Getting Started
 guide below.

Features

🤝 Real-time collaboration with Yjs CRDTs

Conflict-free sync, shared undo/redo, and eventual consistency.

📡 Hybrid transport

Low-latency WebRTC data channels with WebSocket/Redis fallback for signaling & robustness.

👥 Presence & awareness

Remote cursors and user presence via Redis pub/sub, horizontally scalable.

🧠 AI command palette

Generate diagrams, summarize canvases, and create inline text-to-image with smart auto-layout.

🕘 Replay & versioning

Session history plus one-click exports to PNG, PDF, or JSON.

Tech Stack

🧩 Frontend: React, TypeScript, Vite

🪢 Collaboration: Yjs (CRDT), y-webrtc, WebRTC data channels, WebSockets

🧷 Realtime infra: Redis pub/sub for presence, fan-out, signaling

🛠️ Tooling: Vite CLI, dev/build/preview scripts

Architecture

🗺️ Clients maintain a shared Yjs document; updates flow via WebRTC when possible, with WebSockets/Redis fallback.

📣 Presence & signaling handled through Redis pub/sub channels for scalable awareness.

🏗️ Assets built by Vite are production-ready for serving from a static host or CDN.

Getting Started

Prerequisites:

Node.js + npm

Redis instance for presence/signaling

Setup:

git clone <repo-url>
cd scriblio
npm install


Environment:

cp .env.example .env.local
# Set required vars: REDIS_URL, AI provider keys (prefixed with VITE_)


Development:

npm run dev   # start Vite with HMR


Open the localhost URL printed in your terminal.

Production build:

npm run build
npm run preview   # serve built app locally

Environment

🔐 Use .env.local with Vite’s conventions (VITE_* prefix for client-side).

Examples:

VITE_APP_NAME

REDIS_URL

VITE_AI_API_KEY

Scripts

▶️ npm run dev — Vite dev server with HMR

🏗️ npm run build — optimized production build

🔍 npm run preview — preview built app locally

Usage

🖱️ Create or join a canvas and collaborate in real-time.

✨ Use the AI palette for diagrams, summaries, or text-to-image prompts.

📤 Export canvases as PNG, PDF, or JSON; review past sessions with replay/version history.

Project Structure

📂 src/ — React components, hooks, state, providers

📂 public/ — Static assets

🧭 Collaboration, presence, and AI modules are kept modular for testing and upgrades.

Contributing

🤝 Contributions are welcome!

Open issues, fork the repo, and submit PRs.

Keep documentation in sync with code.

Consider adding a CONTRIBUTING.md for coding standards and workflows.

Roadmap

🔐 Auth & team canvases with invites and roles

💬 Persistent history, comments, mentions, and notifications

🧠 Expanded AI actions: smarter auto-layout, diagram refactoring, domain templates

Acknowledgements

🧮 Yjs
 for CRDT-based collaboration

🌐 WebRTC data channels for P2P sync

📣 Redis pub/sub for signaling and presence

⚙️ Vite
 for blazing-fast builds
