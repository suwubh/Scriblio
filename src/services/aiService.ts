// src/services/aiService.ts

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

class AIService {
  private readonly endpoint =
    import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api/chat';


  async chat(request: AIRequest): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();
    return data.content;
  }


  async summarizeCanvas(elementsJSON: string): Promise<string> {
    return this.chat({
      messages: [
        {
          role: 'system',
          content: `
You summarize diagrams for a UI panel.

Rules:
- Be concise (max 4 bullet points)
- No markdown tables
- No headings
- No code blocks
- Plain, simple language
`.trim(),
        },
        {
          role: 'user',
          content: `Summarize this canvas:\n${elementsJSON}`,
        },
      ],
      temperature: 0.3,
      maxTokens: 300,
    });
  }



  async optimizeLayout(elementsJSON: string): Promise<string> {
    return this.chat({
      messages: [
        {
          role: 'system',
          content:
            'You give practical layout and design improvement suggestions.',
        },
        {
          role: 'user',
          content: `Analyze this canvas and suggest improvements:\n\n${elementsJSON}`,
        },
      ],
      maxTokens: 1200,
    });
  }

  async generateDiagram(prompt: string): Promise<any[]> {
    const response = await this.chat({
      messages: [
        {
          role: 'system',
          content: `
You generate Excalidraw diagrams.

STRICT RULES:
- Output ONLY a JSON array
- NO text before or after
- NO explanations
- NO markdown
- Start with '[' and end with ']'

Example:
[
  {
    "type": "rectangle",
    "x": 100,
    "y": 100,
    "width": 120,
    "height": 60,
    "strokeColor": "#000000",
    "backgroundColor": "transparent"
  }
]
        `.trim(),
        },
        {
          role: 'user',
          content: String(prompt),
        },
      ],
      temperature: 0.2, // 🔑 LOWER = MORE STRUCTURED
      maxTokens: 2000,
    });

    // 🔒 Extract JSON array safely
    const match = response.match(/\[[\s\S]*\]/);

    if (!match) {
      console.error('❌ AI returned non-JSON:', response);
      throw new Error('AI did not return valid diagram JSON');
    }

    try {
      return JSON.parse(match[0]);
    } catch (err) {
      console.error('❌ JSON parse failed:', match[0]);
      throw new Error('Failed to parse diagram JSON');
    }
  }

  async generateContent(
    prompt: string,
    canvasContext?: string
  ): Promise<string> {
    return this.chat({
      messages: [
        {
          role: 'user',
          content: `${prompt}${canvasContext ? `\n\nCanvas context:\n${canvasContext}` : ''
            }`,
        },
      ],
      maxTokens: 2000,
    });
  }

  async streamChat(
    messages: AIMessage[],
    onToken: (token: string) => void
  ) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, stream: true }),
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      chunk.split('\n\n').forEach(line => {
        if (line.startsWith('data: ')) {
          const token = line.replace('data: ', '');
          if (token !== '[DONE]') onToken(token);
        }
      });
    }
  }
}

export const aiService = new AIService();
export type { AIService };
