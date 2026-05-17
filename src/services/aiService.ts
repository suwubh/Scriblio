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

export interface AIServiceConfig {
  endpoint: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

class AIService {
  private readonly config: Required<AIServiceConfig>;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = {
      endpoint: import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api/chat',
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 60000,
      ...config,
    };
  }

  private async fetchWithRetry(
    input: RequestInfo,
    init?: RequestInit,
    attempts: number = this.config.retryAttempts
  ): Promise<Response> {
    const requestId = Math.random().toString(36);
    
    try {
      const controller = new AbortController();
      this.abortControllers.set(requestId, controller);

      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      this.abortControllers.delete(requestId);
      
      if (attempts > 1 && !(error instanceof DOMException && error.name === 'AbortError')) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.fetchWithRetry(input, init, attempts - 1);
      }
      throw error;
    }
  }

  async chat(request: AIRequest): Promise<string> {
    try {
      const response = await this.fetchWithRetry(this.config.endpoint, {
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

  async generateDiagram(prompt: string): Promise<any[]> {
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

      const cleanedResponse = response.trim()
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        const hasDescription = /create|draw|make|generate/i.test(cleanedResponse);
        if (hasDescription) {
          throw new Error('AI provided a description instead of diagram data. Try a more specific prompt like "Create 3 rectangles in a row"');
        }
        throw new Error('AI did not return valid diagram data. The response format was incorrect.');
      }

      let elements: any[];
      try {
        elements = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('AI returned malformed JSON. Please try again with a simpler prompt.');
      }

      if (!Array.isArray(elements) || elements.length === 0) {
        throw new Error('AI returned an empty diagram. Try describing what you want to create.');
      }

      const validatedElements = elements.map((el, index) => {
        if (!el.type) {
          el.type = 'rectangle';
        }

        // Provide defaults for missing coordinates
        el.x = el.x ?? 100 + (index * 150);
        el.y = el.y ?? 100 + (Math.floor(index / 3) * 150);
        el.width = el.width ?? 120;
        el.height = el.height ?? 80;
        el.strokeColor = el.strokeColor ?? '#000000';
        el.backgroundColor = el.backgroundColor ?? 'transparent';

        return el;
      });

      return validatedElements;

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

  async streamChat(
    messages: AIMessage[],
    onToken: (token: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const requestId = Math.random().toString(36);
    
    try {
      const controller = new AbortController();
      this.abortControllers.set(requestId, controller);

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, stream: true }),
        signal: controller.signal,
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const token = line.replace('data: ', '');
              if (token !== '[DONE]') {
                onToken(token);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        this.abortControllers.delete(requestId);
      }
    } catch (error) {
      this.abortControllers.delete(requestId);
      console.error('Streaming error:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }
}

export const aiService = new AIService();
export type { AIService };