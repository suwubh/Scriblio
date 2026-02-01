#  Scriblio - AI-Powered Collaborative Whiteboard

![License](https://img.shields.io/badge/License-MIT-green)
![Stars](https://img.shields.io/github/stars/suwubh/Scriblio?style=social)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Yjs-blue)

A real-time collaborative whiteboard that combines **CRDT technology**, **AI assistance**, and a seamless **multiplayer experience** for teams to brainstorm, sketch, and create together.

---

##  Features

###  Core Whiteboard

- **Real-time Collaboration** — Powered by Yjs CRDTs for conflict-free editing
- **Intuitive Drawing Tools** — Smooth, responsive drawing with shapes and annotations
- **Live Presence** — See who's online and actively editing in real-time
- **Responsive Design** — Works seamlessly across desktop and mobile devices

###  AI-Powered

- **AI Command Palette** — Context-aware suggestions with Cmd/Ctrl + K
- **Intelligent Assistance** — AI-powered content generation and optimization
- **Smart Commands** — Natural language interface for whiteboard actions

###  Collaboration Features

- **Hybrid Networking** — WebRTC peer-to-peer with WebSocket fallback
- **Redis Pub/Sub** — Real-time presence and signaling
- **Version History** — Replay and time-travel through board changes
- **Multiple Export Formats** — Save as PNG, PDF, or JSON

---

##  Tech Stack

**Frontend:** React 18, TypeScript, Vite, TailwindCSS  
**Collaboration:** Yjs (CRDT), y-webrtc, WebSocket  
**Backend:** Node.js, Redis, WebSocket Server  
**AI:** Custom AI Server (OpenAI/Groq integration)

---

##  Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **Redis** (or Docker to run Redis)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/suwubh/Scriblio.git
cd Scriblio
npm install
```

### Environment Setup

Create environment configuration files:

```bash
# Copy environment template
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Scriblio Frontend
VITE_WS_URL=ws://localhost:8080
VITE_AI_SERVER_URL=http://localhost:3001

# AI Server
OPENAI_API_KEY=your_openai_key_here
# OR
GROQ_API_KEY=your_anthropic_key_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

##  Running Locally

Scriblio requires **four servers** to run locally. Follow these steps:

### 1 Start Redis Server

**Option A: Using Docker (Recommended)**

```bash
docker run -d -p 6379:6379 --name scriblio-redis redis:alpine
```

**Option B: Local Redis Installation**

```bash
# macOS (Homebrew)
brew services start redis

# Linux (systemd)
sudo systemctl start redis

# Windows
# Download and run from https://redis.io/download
```

Verify Redis is running:

```bash
redis-cli ping
# Should return: PONG
```

---

### 2 Start Signaling Server

The signaling server handles WebSocket connections and WebRTC coordination.

```bash
cd signaling-server
npm install
npm start
```

**Default Port:** `8080`  
**Expected Output:** `WebSocket signaling server running on port 8080`

---

### 3 Start AI Server

The AI server provides intelligent assistance and command processing.

```bash
cd server
npm install
npm start
```

**Default Port:** `3001`  
**Expected Output:** `AI server running on port 3001`

**Note:** Make sure your API key (OpenAI or Anthropic) is configured in `.env`

---

### 4 Start Scriblio Frontend

The main React application that users interact with.

```bash
# From project root
npm run dev
```

**Default Port:** `5173`  
**Access:** Open [http://localhost:5173](http://localhost:5173) in your browser

---

##  Verification Checklist

After starting all servers, verify everything is running:

- [ ] Redis: `redis-cli ping` returns `PONG`
- [ ] Signaling Server: Check terminal for "WebSocket signaling server running"
- [ ] AI Server: Check terminal for "AI server running on port 3001"
- [ ] Scriblio Frontend: Browser opens to `localhost:5173`
- [ ] Test collaboration: Open two browser tabs and draw on both

---

##  Project Structure

```
Scriblio/
├── public/                 # Static assets
├── src/                    # Frontend source code
│   ├── assets/             # Images, icons, resources
│   ├── collaboration/      # CRDT & networking logic
│   ├── components/         # React components
│   ├── engine/             # Whiteboard drawing engine
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Global styles
│   ├── types/              # TypeScript definitions
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── signaling-server/       # WebSocket signaling server
├── server/                 # AI assistance server
├── redis-server/           # Redis configuration
├── package.json            # Dependencies & scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # TailwindCSS config
└── tsconfig.json           # TypeScript config
```

---

##  Usage Guide

### Creating a Session

1. Open Scriblio in your browser
2. A new whiteboard session is created automatically
3. Copy the URL to share with collaborators

### Drawing & Collaboration

- **Draw:** Click and drag on the canvas
- **Shapes:** Use the toolbar to add rectangles, circles, lines
- **Select:** Click the selection tool to move/resize objects
- **Undo/Redo:** Cmd/Ctrl + Z and Cmd/Ctrl + Shift + Z

### AI Commands

1. Press **Cmd/Ctrl + K** to open the AI command palette
2. Type natural language commands:
   - "Create a flowchart for user authentication"
   - "Add a sticky note with project goals"
   - "Organize these elements into a grid"
3. AI will execute or suggest actions

### Export & Save

- **PNG:** Click Export → PNG for a static image
- **PDF:** Click Export → PDF for a document
- **JSON:** Click Export → JSON to save board state

---

##  Production Deployment

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

The `dist/` folder contains optimized static files ready for deployment to:

- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

**Don't forget to deploy:**

- Signaling server (WebSocket)
- AI server (API endpoint)
- Redis instance (managed service recommended)

---

##  Troubleshooting

### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping

# Restart Redis
docker restart scriblio-redis
# OR
brew services restart redis
```

### WebSocket Connection Error

- Verify signaling server is running on port 8080
- Check firewall settings
- Ensure `VITE_WS_URL` in `.env.local` is correct

### AI Server Not Responding

- Verify API key is set in `.env`
- Check AI server logs for errors
- Ensure port 3001 is not in use

### Port Already in Use

```bash
# Kill process on port (macOS/Linux)
lsof -ti:5173 | xargs kill
lsof -ti:8080 | xargs kill
lsof -ti:3001 | xargs kill

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

##  Roadmap

- [ ] **Authentication** — User accounts and permissions
- [ ] **Cloud Storage** — Persistent board storage (PostgreSQL/MongoDB)
- [ ] **Voice Chat** — Integrated audio communication
- [ ] **Templates** — Pre-built board templates
- [ ] **Mobile App** — Native iOS/Android clients
- [ ] **Plugins** — Extensible plugin system
- [ ] **Team Management** — Organizations and workspaces

---

##  Contributing

We welcome contributions! Here's how to get started:

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Scriblio.git
cd Scriblio

# 3. Create a feature branch
git checkout -b feature/amazing-feature

# 4. Make your changes and commit
git commit -m "Add: amazing feature description"

# 5. Push to your fork
git push origin feature/amazing-feature

# 6. Open a Pull Request
```

### Development Guidelines

- Follow existing TypeScript and React patterns
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Run `npm run lint` before committing

---

##  License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

##  Acknowledgments

Built with amazing open-source technologies:

- [Yjs](https://github.com/yjs/yjs) — CRDT implementation
- [React](https://react.dev/) — UI framework
- [Vite](https://vitejs.dev/) — Build tool
- [TailwindCSS](https://tailwindcss.com/) — Utility-first CSS
- [Redis](https://redis.io/) — In-memory data store

---

##  Support & Contact

-  **Issues:** [GitHub Issues](https://github.com/suwubh/Scriblio/issues)
-  **Discussions:** [GitHub Discussions](https://github.com/suwubh/Scriblio/discussions)
-  **Email:** [subhankarsatpathy69@gmail.com](mailto:subhankarsatpathy69@gmail.com)

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with  by [suwubh](https://github.com/suwubh)

</div>