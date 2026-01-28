const express = require('express');
const cors = require('cors');
require('dotenv').config();

const OpenAI = require('openai');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));


const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

if (!openai && !groq) {
  console.warn('⚠️ No AI providers configured');
}


app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    openai: !!openai,
    groq: !!groq,
  });
});


async function streamOpenAI(res, messages, temperature, maxTokens) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 1000,
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices?.[0]?.delta?.content;
    if (token) {
      res.write(`data: ${token}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
}


app.post('/api/chat', async (req, res) => {
  const { messages, temperature, maxTokens, stream } = req.body;

  try {
    if (openai) {
      try {
        if (stream) {
          return await streamOpenAI(
            res,
            messages,
            temperature,
            maxTokens
          );
        }

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: maxTokens ?? 1000,
        });

        return res.json({
          provider: 'openai',
          content: completion.choices[0].message.content,
          usage: completion.usage,
        });
      } catch (err) {
        if (err.status !== 429) throw err;
        console.warn('⚠️ OpenAI quota hit → fallback to Groq');
      }
    }

    if (!groq) {
      return res.status(500).json({
        error: 'No AI providers available',
      });
    }

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 1000,
    });

    res.json({
      provider: 'groq',
      content: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error('❌ AI error:', err);
    res.status(500).json({
      error: 'AI request failed',
      message: err.message,
    });
  }
});


app.listen(PORT, () => {
  console.log(`
🚀 Scriblio AI Proxy running
📍 http://localhost:${PORT}
🏥 /health
🤖 POST /api/chat
  `);
});
