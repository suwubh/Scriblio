/**
 * Scriblio signaling server.
 *
 * Implements the y-webrtc signaling protocol so WebRTC peers in the same room
 * can discover each other and exchange SDP / ICE. The protocol is small:
 *
 *   { type: 'subscribe',   topics: [roomName, ...] }   join topics
 *   { type: 'unsubscribe', topics: [roomName, ...] }   leave topics
 *   { type: 'publish',     topic, data }               relayed verbatim to
 *                                                      every subscriber of
 *                                                      `topic` (including the
 *                                                      sender — y-webrtc
 *                                                      filters its own).
 *   { type: 'ping' }  ->  { type: 'pong' }
 *
 * The previous version re-wrapped `publish` messages as `{type:'signal',...}`,
 * which y-webrtc does not understand — so peers never connected.
 */
const WebSocket = require('ws')
const http = require('http')

const PORT = Number(process.env.PORT) || 4000

// topicName -> Set<ws> of clients subscribed to that topic.
const topics = new Map()

// HTTP + WS share one port (Render free tier only exposes one).
const httpServer = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'scriblio-signaling',
      topics: topics.size,
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
  if (request.url === '/bench') {
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
  console.log(`Scriblio signaling server running on port ${PORT}`)
})

// Echo `sentAt` back so k6 can measure RTT against this endpoint.
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
      // ignore non-JSON frames on the bench channel
    }
  })
})

const send = (ws, message) => {
  if (ws.readyState !== WebSocket.CONNECTING && ws.readyState !== WebSocket.OPEN) {
    ws.close()
    return
  }
  try {
    ws.send(JSON.stringify(message))
  } catch (_err) {
    ws.close()
  }
}

wss.on('connection', (ws) => {
  const subscribedTopics = new Set()
  let closed = false

  // Keep-alive ping so idle proxies (Render, etc.) don't drop the socket.
  let pongReceived = true
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      ws.close()
      return
    }
    pongReceived = false
    try {
      ws.ping()
    } catch (_err) {
      ws.close()
    }
  }, 30000)
  ws.on('pong', () => { pongReceived = true })

  ws.on('close', () => {
    subscribedTopics.forEach((topicName) => {
      const subs = topics.get(topicName)
      if (subs) {
        subs.delete(ws)
        if (subs.size === 0) topics.delete(topicName)
      }
    })
    subscribedTopics.clear()
    closed = true
    clearInterval(pingInterval)
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })

  ws.on('message', (data) => {
    let message
    try {
      message = JSON.parse(data.toString())
    } catch (_err) {
      return
    }
    if (!message || typeof message.type !== 'string' || closed) return

    switch (message.type) {
      case 'subscribe':
        ;(message.topics || []).forEach((topicName) => {
          if (typeof topicName !== 'string') return
          let subs = topics.get(topicName)
          if (!subs) {
            subs = new Set()
            topics.set(topicName, subs)
          }
          subs.add(ws)
          subscribedTopics.add(topicName)
        })
        break

      case 'unsubscribe':
        ;(message.topics || []).forEach((topicName) => {
          const subs = topics.get(topicName)
          if (subs) subs.delete(ws)
        })
        break

      case 'publish':
        if (message.topic) {
          const receivers = topics.get(message.topic)
          if (receivers) {
            message.clients = receivers.size
            receivers.forEach((receiver) => send(receiver, message))
          }
        }
        break

      case 'ping':
        send(ws, { type: 'pong', sentAt: message.sentAt })
        break

      default:
        break
    }
  })
})

function shutdown() {
  console.log('Shutting down signaling server...')
  wss.close(() => {
    benchWss.close(() => {
      httpServer.close(() => process.exit(0))
    })
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
