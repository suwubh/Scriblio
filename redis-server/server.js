const WebSocket = require('ws')
const Redis = require('redis')

// Create Redis clients
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

const redisSubscriber = redisClient.duplicate()
const redisPublisher = redisClient.duplicate()

// WebSocket server
const wss = new WebSocket.Server({ 
  port: 8080,
  cors: {
    origin: '*'
  }
})

console.log('Redis WebSocket bridge running on ws://localhost:8080')

// Connect to Redis
async function connectRedis() {
  await redisClient.connect()
  await redisSubscriber.connect()
  await redisPublisher.connect()
  console.log('Connected to Redis')
}

connectRedis().catch(console.error)

// Store active connections
const connections = new Map()

wss.on('connection', (ws) => {
  const connectionId = Math.random().toString(36).substr(2, 9)
  connections.set(connectionId, { ws, subscriptions: new Set() })
  
  console.log(`Client connected: ${connectionId}`)

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString())
      const connection = connections.get(connectionId)

      switch (message.type) {
        case 'subscribe':
          // Subscribe to Redis channel
          if (!connection.subscriptions.has(message.channel)) {
            connection.subscriptions.add(message.channel)
            
            await redisSubscriber.subscribe(message.channel, (redisMessage) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  channel: message.channel,
                  data: JSON.parse(redisMessage)
                }))
              }
            })
            
            console.log(`Subscribed ${connectionId} to ${message.channel}`)
          }
          break

        case 'publish':
          // Publish to Redis channel
          await redisPublisher.publish(
            message.channel, 
            JSON.stringify(message.data)
          )
          console.log(`Published to ${message.channel}`)
          break

        case 'unsubscribe':
          // Unsubscribe from Redis channel
          if (connection.subscriptions.has(message.channel)) {
            await redisSubscriber.unsubscribe(message.channel)
            connection.subscriptions.delete(message.channel)
            console.log(`Unsubscribed ${connectionId} from ${message.channel}`)
          }
          break
      }
    } catch (error) {
      console.error('Message handling error:', error)
    }
  })

  ws.on('close', async () => {
    const connection = connections.get(connectionId)
    if (connection) {
      // Unsubscribe from all channels
      for (const channel of connection.subscriptions) {
        await redisSubscriber.unsubscribe(channel)
      }
      connections.delete(connectionId)
    }
    console.log(`Client disconnected: ${connectionId}`)
  })

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${connectionId}:`, error)
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  wss.close()
  await redisClient.quit()
  await redisSubscriber.quit()
  await redisPublisher.quit()
  process.exit(0)
})
