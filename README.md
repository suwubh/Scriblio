# ✏️ Scriblio - AI-Powered Collaborative Whiteboard

Scriblio is an **AI-powered collaborative whiteboard** that lets teams brainstorm, sketch, and create in real time. It combines CRDT-based synchronization, hybrid networking, and smart AI features to give you a seamless, interactive whiteboard experience.

## 🚀 Features

* ⚡ **Real-time Collaboration** — Built with **Yjs (CRDT)** for conflict-free editing
* 🌐 **Hybrid Networking** — Uses WebRTC for peer-to-peer + WebSocket + Redis fallback
* 🧑‍🤝‍🧑 **Presence** — See who’s online and active with Redis pub/sub
* 🤖 **AI Command Palette** — Context-aware AI suggestions & commands
* 📜 **Replay & Versioning** — Travel back in time and replay board activity
* 📤 **Export Options** — Export your boards as **PNG, PDF, or JSON**

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite
* **Collaboration:** Yjs, y-webrtc, WebSocket
* **Backend:** Redis (for signaling & presence)
* **Other:** TailwindCSS, AI integration

## 📸 Screenshots

| ![Screenshot 1](./screenshots/screenshot1.png) | ![Screenshot 2](./screenshots/screenshot2.png) |
| ---------------------------------------------- | ---------------------------------------------- |
| ![Screenshot 3](./screenshots/screenshot3.png) | ![Screenshot 4](./screenshots/screenshot4.png) |
| ![Screenshot 5](./screenshots/screenshot5.png) | ![Screenshot 6](./screenshots/screenshot6.png) |

## ⚙️ Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (>= 18)
* [Redis](https://redis.io/) running locally or in Docker

### Setup

```bash
# Clone the repo
git clone https://github.com/suwubh/Scriblio.git
cd Scriblio

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start Redis (if using Docker)
docker run -d -p 6379:6379 redis:alpine

# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📂 Project Structure

```
Scriblio/
├── public/          # Static assets
├── src/             # React + Yjs code
│   ├── components/  # UI components
│   ├── hooks/       # Custom React hooks
│   ├── store/       # State management
│   └── utils/       # Helper functions
├── package.json
└── README.md
```

## 📌 Roadmap

* [ ] Authentication & user accounts
* [ ] Cloud storage support
* [ ] Voice chat integration
* [ ] Mobile responsive UI

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a PR

## 📜 License

This project is licensed under the [MIT License](./LICENSE).
