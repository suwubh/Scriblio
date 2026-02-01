const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')

// Create WebSocket server
const wss = new WebSocket.Server({ 
  port: 4000,
  perMessageDeflate: false
})

// Store active connections by room
const rooms = new Map()
const clients = new Map()

console.log('Scriblio Signaling Server running on ws://localhost:4000')

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
      // Respond to ping with pong
      ws.send(JSON.stringify({ type: 'pong' }))
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

// Health check endpoint
const http = require('http')
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'healthy', 
      clients: clients.size,
      rooms: rooms.size,
      timestamp: new Date().toISOString()
    }))
  } else {
    res.writeHead(404)
    res.end('Not Found')
  }
})

healthServer.listen(4001, () => {
  console.log('Health check server running on http://localhost:4001/health')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down signaling server...')
  wss.close(() => {
    healthServer.close(() => {
      process.exit(0)
    })
  })
})

process.on('SIGINT', () => {
  console.log('Shutting down signaling server...')
  wss.close(() => {
    healthServer.close(() => {
      process.exit(0)
    })
  })
})
