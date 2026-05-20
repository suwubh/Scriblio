const WebSocket = require('ws')
const Redis = require('redis')

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const PORT = Number(process.env.PORT) || 8080

// One shared publisher for the whole process. Subscribers, however, are created
// per WebSocket connection (see below) — node-redis routes a channel's messages
// to whichever client subscribed it, and unsubscribing is per-client, so a
// shared subscriber would make one user's disconnect silence everyone else in
// the same room.
const redisPublisher = Redis.createClient({ url: REDIS_URL })

const wss = new WebSocket.Server({ port: PORT })
console.log(`Redis WebSocket bridge running on ws://localhost:${PORT}`)

redisPublisher
  .connect()
  .then(() => console.log('Redis publisher connected'))
  .catch((err) => console.error('Redis publisher failed to connect:', err))

wss.on('connection', async (ws) => {
  const connectionId = Math.random().toString(36).slice(2, 11)

  // Dedicated subscriber connection for this client only.
  const subscriber = redisPublisher.duplicate()
  const subscriptions = new Set()
  let alive = true

  try {
    await subscriber.connect()
  } catch (err) {
    console.error(`Subscriber failed for ${connectionId}:`, err)
    ws.close()
    return
  }

  console.log(`Client connected: ${connectionId}`)

  ws.on('message', async (data) => {
    let message
    try {
      message = JSON.parse(data.toString())
    } catch {
      return // ignore non-JSON frames
    }

    try {
      switch (message.type) {
        case 'subscribe':
          if (message.channel && !subscriptions.has(message.channel)) {
            subscriptions.add(message.channel)
            await subscriber.subscribe(message.channel, (raw) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ channel: message.channel, data: JSON.parse(raw) }))
              }
            })
          }
          break

        case 'publish':
          if (message.channel) {
            await redisPublisher.publish(message.channel, JSON.stringify(message.data))
          }
          break

        case 'unsubscribe':
          if (message.channel && subscriptions.has(message.channel)) {
            await subscriber.unsubscribe(message.channel)
            subscriptions.delete(message.channel)
          }
          break

        case 'ping':
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }))
          }
          break
      }
    } catch (err) {
      console.error(`Message handling error (${connectionId}):`, err)
    }
  })

  ws.on('close', async () => {
    if (!alive) return
    alive = false
    try {
      await subscriber.quit()
    } catch {
      // ignore — connection is going away anyway
    }
    console.log(`Client disconnected: ${connectionId}`)
  })

  ws.on('error', (err) => {
    console.error(`WebSocket error for ${connectionId}:`, err)
  })
})

process.on('SIGTERM', async () => {
  console.log('Shutting down Redis bridge...')
  wss.close()
  try {
    await redisPublisher.quit()
  } catch {
    // ignore
  }
  process.exit(0)
})
