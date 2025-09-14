# ✏️ Scriblio - AI-Powered Collaborative Whiteboard

> A real-time collaborative whiteboard that combines CRDT technology, AI assistance, and seamless multiplayer experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-82.3%25-blue)
![React](https://img.shields.io/badge/react-latest-61dafb)

## 🌟 Overview

Scriblio is an **AI-powered collaborative whiteboard** designed for teams who need to brainstorm, sketch, and create together in real-time. Built with modern web technologies and conflict-free replicated data types (CRDTs), it ensures seamless collaboration without the frustration of sync conflicts.

## ✨ Features

### Core Functionality
- 🚀 **Real-time Collaboration** - Powered by Yjs CRDTs for conflict-free editing
- 🌐 **Hybrid Networking** - WebRTC peer-to-peer with WebSocket + Redis fallback
- 👥 **Live Presence** - See who's online and actively editing with Redis pub/sub
- 🎨 **Intuitive Drawing** - Smooth, responsive drawing tools and shapes

### AI-Powered Features
- 🤖 **AI Command Palette** - Context-aware suggestions and smart commands
- 💡 **Intelligent Assistance** - AI-powered content generation and optimization

### Advanced Capabilities
- ⏱️ **Replay & Versioning** - Time travel through board history
- 📤 **Export Options** - Save as PNG, PDF, or JSON formats
- 📱 **Responsive Design** - Works seamlessly across devices

## 🛠️ Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)

**Real-time Collaboration**
- Yjs (CRDT implementation)
- y-webrtc (WebRTC provider)
- WebSocket (fallback transport)

**Backend & Infrastructure**
- Redis (signaling & presence)
- Node.js (server runtime)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Redis server (local or Docker)
- npm or yarn

### Installation

1. **Clone the repository**
git clone https://github.com/suwubh/Scriblio.git
cd Scriblio

text

2. **Install dependencies**
npm install

text

3. **Set up environment**
cp .env.example .env.local

Edit .env.local with your configuration
text

4. **Start Redis** (if using Docker)
docker run -d -p 6379:6379 --name redis redis:alpine

text

5. **Run development server**
npm run dev

text

6. **Open your browser**
Visit `http://localhost:5173` to start collaborating!

### Production Build

npm run build
npm run preview

text

## 📁 Project Structure

Scriblio/
├── public/ # Static assets
├── src/
│ ├── components/ # React components
│ │ ├── Whiteboard/ # Core whiteboard functionality
│ │ ├── UI/ # Reusable UI components
│ │ └── AI/ # AI-related components
│ ├── hooks/ # Custom React hooks
│ ├── store/ # State management
│ ├── utils/ # Helper functions & utilities
│ ├── types/ # TypeScript definitions
│ └── styles/ # Global styles
├── server/ # Backend services (if applicable)
└── docs/ # Documentation

text

## 🎯 Usage

### Basic Collaboration
1. Create or join a whiteboard session
2. Start drawing, writing, or adding shapes
3. Invite others with the shareable link
4. Watch real-time updates as others contribute

### AI Features
- Press `Cmd/Ctrl + K` to open the AI command palette
- Use natural language to describe what you want to create
- Let AI suggest improvements or generate content

### Export & Sharing
- Click the export button to download as PNG, PDF, or JSON
- Share the board URL for real-time collaboration
- Use version history to review changes

## 🗺️ Roadmap

- [ ] **Authentication System** - User accounts and permissions
- [ ] **Cloud Storage** - Persistent board storage
- [ ] **Voice Chat** - Integrated audio communication
- [ ] **Mobile App** - Native iOS/Android clients
- [ ] **API Integration** - Connect with external tools
- [ ] **Team Management** - Organizations and team features

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
git checkout -b feature/amazing-feature

text
3. **Make your changes**
4. **Commit with descriptive messages**
git commit -m "Add amazing feature"

text
5. **Push to your fork**
git push origin feature/amazing-feature

text
6. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Yjs](https://github.com/yjs/yjs) - Amazing CRDT implementation
- [React](https://reactjs.org/) - UI framework
- [TailwindCSS](https://tailwindcss.com/) - Styling utilities
- [Redis](https://redis.io/) - High-performance data store

## 📞 Support

- 🐛 [Report Issues](https://github.com/suwubh/Scriblio/issues)
- 💬 [Discussions](https://github.com/suwubh/Scriblio/discussions)
- 📧 Contact: [subhankarsatpathy69@gmail.com]

---

⭐ **Star this repo** if you find it useful!
