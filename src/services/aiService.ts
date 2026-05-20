import { parseDiagramResponse, RawDiagramElement } from './diagramParser';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIServiceConfig {
  endpoint: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

class AIService {
  private readonly config: Required<AIServiceConfig>;

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = {
      endpoint: import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api/chat',
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 60000,
      ...config,
    };
  }

  /** Fetches with a timeout, retrying transient failures with a fixed delay. */
  private async fetchWithRetry(
    init: RequestInit,
    attempts: number = this.config.retryAttempts
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.endpoint, {
        ...init,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      if (attempts > 1 && !aborted) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.fetchWithRetry(init, attempts - 1);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async chat(request: AIRequest): Promise<string> {
    try {
      const response = await this.fetchWithRetry({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('AI Service Error:', error);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to reach AI service');
      }
      throw error;
    }
  }

  async summarizeCanvas(elementsJSON: string): Promise<string> {
    return this.chat({
      messages: [
        {
          role: 'system',
          content: `You summarize diagrams concisely.
Rules:
- Maximum 4 bullet points
- Plain language, no markdown
- Focus on key elements and relationships`.trim(),
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

  async generateDiagram(prompt: string): Promise<RawDiagramElement[]> {
    try {
      const response = await this.chat({
        messages: [
          {
            role: 'system',
            content: `You are an Excalidraw diagram generator. You MUST respond with ONLY a valid JSON array.

CRITICAL RULES:
1. Output ONLY a JSON array starting with [ and ending with ]
2. NO markdown code blocks (no \`\`\`json or \`\`\`)
3. NO explanations before or after the JSON
4. NO text outside the JSON array
5. Each element must have: type, x, y, width, height, strokeColor, backgroundColor

Valid element types: "rectangle", "ellipse", "diamond", "arrow", "line", "text"

Example output (this is the ONLY acceptable format):
[{"type":"rectangle","x":100,"y":100,"width":200,"height":100,"strokeColor":"#000000","backgroundColor":"transparent"}]`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        maxTokens: 3000,
      });

      return parseDiagramResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('abort')) {
          throw new Error('Request took too long. Try a simpler diagram or try again.');
        }
        if (error.message.includes('Network error')) {
          throw new Error('Cannot connect to AI service. Check your internet connection.');
        }
        throw error;
      }
      throw new Error('Failed to generate diagram. Please try again.');
    }
  }

  async optimizeLayout(elementsJSON: string): Promise<string> {
    return this.chat({
      messages: [
        {
          role: 'system',
          content: 'You provide practical layout and design improvements for diagrams.',
        },
        {
          role: 'user',
          content: `Analyze and suggest improvements:\n\n${elementsJSON}`,
        },
      ],
      maxTokens: 1200,
    });
  }

  async generateContent(prompt: string, canvasContext?: string): Promise<string> {
    return this.chat({
      messages: [
        {
          role: 'user',
          content: `${prompt}${canvasContext ? `\n\nCanvas context:\n${canvasContext}` : ''}`,
        },
      ],
      maxTokens: 2000,
    });
  }
}

export const aiService = new AIService();
export type { AIService };
