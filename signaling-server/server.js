const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')
const http = require('http')

const PORT = Number(process.env.PORT) || 4000

const rooms = new Map()
const clients = new Map()

// HTTP + WS on the same port (Render free tier only exposes one).
// GET / and GET /health respond with status JSON; everything else is a WS upgrade.
const httpServer = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'scriblio-signaling',
      clients: clients.size,
      rooms: rooms.size,
      timestamp: new Date().toISOString(),
    }))
    return
  }
  res.writeHead(404)
  res.end('Not Found')
})

const wss = new WebSocket.Server({ noServer: true, perMessageDeflate: false })
const benchWss = new WebSocket.Server({ noServer: true, perMessageDeflate: false })

httpServer.on('upgrade', (request, socket, head) => {
  const { url } = request
  if (url === '/bench') {
    benchWss.handleUpgrade(request, socket, head, (ws) => {
      benchWss.emit('connection', ws, request)
    })
  } else {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
  }
})

httpServer.listen(PORT, () => {
  console.log(`Scriblio Signaling Server running on port ${PORT}`)
})

// Echo `sentAt` back so k6 can compute RTT against this endpoint.
benchWss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      ws.send(JSON.stringify({
        type: 'pong',
        sentAt: message.sentAt,
        echoedAt: Date.now(),
      }))
    } catch (_err) {
      // ignore non-JSON frames on bench channel
    }
  })
})

wss.on('connection', (ws, request) => {
  const clientId = uuidv4()
  clients.set(ws, { id: clientId, rooms: new Set() })

  console.log(`Client connected: ${clientId}`)

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      handleMessage(ws, message)
    } catch (error) {
      console.error('Invalid message format:', error)
    }
  })
  
  ws.on('close', () => {
    const client = clients.get(ws)
    if (client) {
      // Remove client from all rooms
      client.rooms.forEach(roomName => {
        const room = rooms.get(roomName)
        if (room) {
          room.delete(ws)
          if (room.size === 0) {
            rooms.delete(roomName)
          } else {
            // Notify other clients that someone left
            broadcastToRoom(roomName, {
              type: 'peer-left',
              peer: client.id
            }, ws)
          }
        }
      })
      clients.delete(ws)
      console.log(`Client disconnected: ${client.id}`)
    }
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

function handleMessage(ws, message) {
  const client = clients.get(ws)
  if (!client) return
  
  switch (message.type) {
    case 'subscribe':
      handleSubscribe(ws, message, client)
      break
    case 'publish':
      handlePublish(ws, message, client)
      break
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', sentAt: message.sentAt }))
      break
    default:
      console.log(`Unknown message type: ${message.type}`)
  }
}

function handleSubscribe(ws, message, client) {
  if (!message.topics || !Array.isArray(message.topics)) return
  
  message.topics.forEach(topic => {
    // Join room
    if (!rooms.has(topic)) {
      rooms.set(topic, new Set())
    }
    
    const room = rooms.get(topic)
    room.add(ws)
    client.rooms.add(topic)
    
    console.log(`Client ${client.id} joined room: ${topic}`)
    
    // Notify existing clients about new peer
    broadcastToRoom(topic, {
      type: 'peer-joined',
      peer: client.id
    }, ws)
    
    // Send existing peers to new client
    const existingPeers = Array.from(room)
      .filter(otherWs => otherWs !== ws)
      .map(otherWs => clients.get(otherWs)?.id)
      .filter(Boolean)
    
    if (existingPeers.length > 0) {
      ws.send(JSON.stringify({
        type: 'peers',
        peers: existingPeers
      }))
    }
  })
}

function handlePublish(ws, message, client) {
  if (!message.topic) return
  
  // Relay message to all other clients in the room
  broadcastToRoom(message.topic, {
    type: 'signal',
    from: client.id,
    signal: message
  }, ws)
}

function broadcastToRoom(roomName, message, exclude = null) {
  const room = rooms.get(roomName)
  if (!room) return
  
  const messageStr = JSON.stringify(message)
  
  room.forEach(clientWs => {
    if (clientWs !== exclude && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(messageStr)
    }
  })
}

function shutdown() {
  console.log('Shutting down signaling server...')
  wss.close(() => {
    benchWss.close(() => {
      httpServer.close(() => {
        process.exit(0)
      })
    })
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
