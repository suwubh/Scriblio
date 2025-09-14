# ✏️ Scriblio - AI-Powered Collaborative Whiteboard

![License](https://img.shields.io/github/license/suwubh/Scriblio)
![Stars](https://img.shields.io/github/stars/suwubh/Scriblio?style=social)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Yjs-blue)

A real-time collaborative whiteboard that combines **CRDT technology**, **AI assistance**, and a seamless **multiplayer experience**.

---

## 🌟 Overview

Scriblio is an **AI-powered collaborative whiteboard** designed for teams to brainstorm, sketch, and create together in real-time. Built with modern web technologies and **conflict-free replicated data types (CRDTs)**, it ensures smooth collaboration without sync conflicts.

---

## ✨ Features

### Core Functionality

* 🚀 **Real-time Collaboration** — Powered by **Yjs CRDTs** for conflict-free editing
* 🌐 **Hybrid Networking** — WebRTC peer-to-peer with WebSocket + Redis fallback
* 👥 **Live Presence** — See who's online and actively editing with Redis pub/sub
* 🎨 **Intuitive Drawing** — Smooth, responsive drawing tools and shapes

### AI-Powered Features

* 🤖 **AI Command Palette** — Context-aware suggestions and smart commands
* 💡 **Intelligent Assistance** — AI-powered content generation and optimization

### Advanced Capabilities

* ⏱️ **Replay & Versioning** — Time travel through board history
* 📤 **Export Options** — Save as PNG, PDF, or JSON formats
* 📱 **Responsive Design** — Works seamlessly across devices

---

## 🛠️ Tech Stack

### Frontend

* React 18 + TypeScript
* Vite (build tool)
* TailwindCSS (styling)

### Real-time Collaboration

* Yjs (CRDT implementation)
* y-webrtc (WebRTC provider)
* WebSocket (fallback transport)

### Backend & Infrastructure

* Redis (signaling & presence)
* Node.js (server runtime)

---

## 🚀 Quick Start

### Prerequisites

* Node.js >= 18.0.0
* Redis server (local or Docker)
* npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/suwubh/Scriblio.git
cd Scriblio

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Then edit .env.local with your configuration

# Start Redis (if using Docker)
docker run -d -p 6379:6379 --name redis redis:alpine

# Run development server
npm run dev

# Open in browser
http://localhost:5173
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```bash
Scriblio/
├── public/             # Static assets
├── src/                # Application source
│   ├── components/     # React components
│   │   ├── Whiteboard/ # Core whiteboard functionality
│   │   ├── UI/         # Reusable UI components
│   │   └── AI/         # AI-related components
│   ├── hooks/          # Custom React hooks
│   ├── store/          # State management (Yjs bindings, presence)
│   ├── utils/          # Helper functions & utilities
│   ├── types/          # TypeScript definitions
│   └── styles/         # Global styles (Tailwind + custom)
├── server/             # Backend services (if applicable)
├── docs/               # Documentation
├── package.json        # Project metadata & scripts
├── .env.example        # Example environment variables
└── vite.config.ts      # Vite configuration
```

---

## 🎯 Usage

### Basic Collaboration

1. Create or join a whiteboard session
2. Start drawing, writing, or adding shapes
3. Invite others with the shareable link
4. Watch real-time updates as others contribute

### AI Features

* Press **Cmd/Ctrl + K** to open the AI command palette
* Use natural language to describe what you want to create
* Let AI suggest improvements or generate content

### Export & Sharing

* Click the export button to download as PNG, PDF, or JSON
* Share the board URL for real-time collaboration
* Use version history to review changes

---

## 🗺️ Roadmap

* [ ] Authentication System — User accounts and permissions
* [ ] Cloud Storage — Persistent board storage
* [ ] Voice Chat — Integrated audio communication
* [ ] Mobile App — Native iOS/Android clients
* [ ] API Integration — Connect with external tools
* [ ] Team Management — Organizations and team features

---

## 🤝 Contributing

Contributions are welcomed! Here's how to get started:

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/amazing-feature

# 3. Make your changes

# 4. Commit with descriptive messages
git commit -m "Add amazing feature"

# 5. Push to your fork
git push origin feature/amazing-feature
```

6. Open a Pull Request

### Development Guidelines

* Follow TypeScript best practices
* Write tests for new features
* Update documentation as needed
* Follow the existing code style

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🙏 Acknowledgments

* [Yjs](https://github.com/yjs/yjs) — Amazing CRDT implementation
* [React](https://react.dev/) — UI framework
* [TailwindCSS](https://tailwindcss.com/) — Styling utilities
* [Redis](https://redis.io/) — High-performance data store

---

## 📞 Support

* 🐛 [Report Issues](https://github.com/suwubh/Scriblio/issues)
* 💬 [Discussions](https://github.com/suwubh/Scriblio/discussions)
* 📧 Contact: [subhankarsatpathy69@gmail.com](mailto:subhankarsatpathy69@gmail.com)

⭐ **Star this repo if you find it useful!**
