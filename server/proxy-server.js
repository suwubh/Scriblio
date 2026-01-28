// server/proxy-server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));


const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MOCK_MODE = process.env.MOCK_MODE === 'true' || !ANTHROPIC_API_KEY;

if (MOCK_MODE) {
  console.log('⚠️  Running in MOCK MODE (no API key provided)');
  console.log('   Set ANTHROPIC_API_KEY in .env file to use real API');
} else {
  console.log('✅ Using real Anthropic API');
}

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: MOCK_MODE ? 'mock' : 'real',
    hasApiKey: !!ANTHROPIC_API_KEY
  });
});

const mockResponses = {
  chat: (prompt) => {
    const responses = [
      "I'm a mock AI response! To use the real Claude API, add your ANTHROPIC_API_KEY to the .env file.",
      "This is a simulated response. The actual AI integration works on claude.ai without any API key needed!",
      "Mock mode is great for testing the UI. Deploy to claude.ai for real AI capabilities.",
    ];
    return responses[Math.floor(Math.random() * responses.length)] + 
           `\n\nYour prompt was: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`;
  },
  
  diagram: () => [
    {
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 120,
      height: 60,
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      text: 'Step 1: Start'
    },
    {
      type: 'arrow',
      x: 160,
      y: 160,
      width: 0,
      height: 80,
      strokeColor: '#000000',
      backgroundColor: 'transparent'
    },
    {
      type: 'rectangle',
      x: 100,
      y: 240,
      width: 120,
      height: 60,
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      text: 'Step 2: Process'
    },
    {
      type: 'arrow',
      x: 160,
      y: 300,
      width: 0,
      height: 80,
      strokeColor: '#000000',
      backgroundColor: 'transparent'
    },
    {
      type: 'rectangle',
      x: 100,
      y: 380,
      width: 120,
      height: 60,
      strokeColor: '#000000',
      backgroundColor: 'transparent',
      text: 'Step 3: End'
    }
  ]
};

app.post('/api/chat', async (req, res) => {
  try {
    console.log('📨 Received chat request');
    
    const { messages, temperature, maxTokens, model } = req.body;
    const lastMessage = messages[messages.length - 1].content;

    if (MOCK_MODE) {
      console.log('🎭 Using mock response');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isDiagramRequest = lastMessage.toLowerCase().includes('generate') || 
                               lastMessage.toLowerCase().includes('create') ||
                               lastMessage.toLowerCase().includes('draw');
      
      let mockContent;
      if (isDiagramRequest && lastMessage.toLowerCase().includes('json')) {
        mockContent = JSON.stringify(mockResponses.diagram(), null, 2);
      } else {
        mockContent = mockResponses.chat(lastMessage);
      }
      
      return res.json({
        content: [
          {
            type: 'text',
            text: mockContent
          }
        ],
        usage: {
          input_tokens: 10,
          output_tokens: 20
        },
        model: 'mock-model',
        mock: true
      });
    }

    console.log('🤖 Using real Anthropic API');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: maxTokens || 1000,
        messages: messages,
        temperature: temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Anthropic API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'API request failed',
        details: errorText,
      });
    }

    const data = await response.json();
    console.log('✅ Chat response received');
    
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Scriblio AI Proxy Server Running  ║
╚════════════════════════════════════════╝

📍 Server: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health
🤖 API: http://localhost:${PORT}/api/chat

${MOCK_MODE ? `
⚠️  MOCK MODE ACTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Responses are simulated (no API key found)
   
   To use real Claude API:
   1. Create a .env file in the server/ directory
   2. Add: ANTHROPIC_API_KEY=your_key_here
   3. Get a key from: https://console.anthropic.com/
   4. Restart the server
   
   Or deploy to claude.ai where API keys are handled automatically!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : `
✅ REAL API MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Using actual Claude AI responses
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}

⚠️  Note: This proxy is for local development only.
    In production (claude.ai), API calls work directly.

Press Ctrl+C to stop
  `);
});