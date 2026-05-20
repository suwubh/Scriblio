import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';
import Groq from 'groq-sdk';

const app = express();
const PORT = process.env.PORT || 3001;

// Only allow the frontend origin(s) to call the proxy. Without this, the
// deployed proxy is an open relay anyone can use to spend our API quota.
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (no Origin header) and whitelisted origins.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(json({ limit: '256kb' }));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

if (!openai && !groq) {
  console.warn('No AI providers configured');
}

// --- Simple in-memory rate limiter (sliding window, per IP) -----------------
// Keeps a single misbehaving client from draining the API quota. In-memory is
// fine for a single instance; a multi-instance deploy would move this to Redis.
const RATE_LIMIT = 20; // requests
const RATE_WINDOW_MS = 60_000; // per minute
const hits = new Map(); // ip -> number[] (request timestamps)

function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
  recent.push(now);
  hits.set(ip, recent);
  next();
}

// Drop stale IP buckets occasionally so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) {
    if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', openai: !!openai, groq: !!groq });
});

/** Validates and clamps the request body so the client can't pick huge limits. */
function parseChatRequest(body) {
  const { messages, temperature, maxTokens } = body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: 'messages must be a non-empty array' };
  }
  for (const m of messages) {
    if (!m || typeof m.role !== 'string' || typeof m.content !== 'string') {
      return { error: 'each message needs a string role and content' };
    }
  }

  return {
    messages,
    temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 2),
    maxTokens: Math.min(Math.max(Number(maxTokens) || 1000, 1), 2000),
  };
}

app.post('/api/chat', rateLimit, async (req, res) => {
  const parsed = parseChatRequest(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  const { messages, temperature, maxTokens } = parsed;

  try {
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature,
          max_tokens: maxTokens,
        });

        return res.json({
          provider: 'openai',
          content: completion.choices[0].message.content,
          usage: completion.usage,
        });
      } catch (err) {
        if (err.status !== 429) throw err;
        console.warn('OpenAI quota hit → falling back to Groq');
      }
    }

    if (!groq) {
      return res.status(500).json({ error: 'No AI providers available' });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    res.json({
      provider: 'groq',
      content: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI request failed', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Scriblio AI proxy running on http://localhost:${PORT}`);
});
