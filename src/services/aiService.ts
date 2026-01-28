// src/services/aiService.ts

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface DiagramGenerationRequest {
  prompt: string;
  canvasContext?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'sketch' | 'diagram' | 'realistic';
}

class AIService {
  private readonly apiEndpoint = 'https://api.anthropic.com/v1/messages';
  private readonly model = 'claude-sonnet-4-20250514';

  /**
   * Send a chat message to Claude AI
   */
  async chat(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: request.maxTokens || 1000,
          messages: request.messages,
          temperature: request.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract text content from response
      const textContent = data.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('\n');

      return {
        content: textContent,
        usage: data.usage ? {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
        } : undefined,
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  /**
   * Summarize canvas elements
   */
  async summarizeCanvas(elementsJSON: string): Promise<string> {
    const response = await this.chat({
      messages: [
        {
          role: 'user',
          content: `Please analyze this canvas and provide a concise summary of what's drawn:

${elementsJSON}

Provide a brief, human-readable summary of:
1. What types of elements are present (shapes, text, images, etc.)
2. The overall structure or layout
3. Any apparent purpose or meaning
4. Suggestions for improvement`,
        },
      ],
      maxTokens: 1500,
    });

    return response.content;
  }

  /**
   * Generate diagram based on description
   */
  async generateDiagram(request: DiagramGenerationRequest): Promise<any[]> {
    const systemPrompt = `You are a diagram generation assistant. Based on the user's description, generate a JSON array of Excalidraw elements that form the requested diagram.

Each element should have this structure:
{
  "type": "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "text",
  "x": number,
  "y": number,
  "width": number,
  "height": number,
  "strokeColor": "#000000",
  "backgroundColor": "transparent",
  "text": "optional text content"
}

${request.canvasContext ? `Current canvas context:\n${request.canvasContext}` : ''}

Return ONLY the JSON array, no explanations or markdown formatting.`;

    const response = await this.chat({
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\nGenerate diagram for: ${request.prompt}`,
        },
      ],
      maxTokens: 2000,
      temperature: 0.8,
    });

    try {
      // Clean response and parse JSON
      let jsonContent = response.content.trim();
      
      // Remove markdown code blocks if present
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const elements = JSON.parse(jsonContent);
      
      // Ensure elements are valid
      if (!Array.isArray(elements)) {
        throw new Error('Response is not an array');
      }

      return elements;
    } catch (error) {
      console.error('Failed to parse diagram JSON:', error);
      throw new Error('Failed to generate diagram. Please try again.');
    }
  }

  /**
   * Optimize canvas layout
   */
  async optimizeLayout(elementsJSON: string): Promise<string> {
    const response = await this.chat({
      messages: [
        {
          role: 'user',
          content: `Analyze this canvas layout and provide optimization suggestions:

${elementsJSON}

Provide specific suggestions for:
1. Better spatial organization
2. Alignment improvements
3. Color scheme recommendations
4. Grouping related elements
5. Removing clutter`,
        },
      ],
      maxTokens: 1500,
    });

    return response.content;
  }

  /**
   * Generate text content based on canvas
   */
  async generateContent(prompt: string, canvasContext?: string): Promise<string> {
    const contextPrompt = canvasContext 
      ? `\n\nCurrent canvas context:\n${canvasContext}` 
      : '';

    const response = await this.chat({
      messages: [
        {
          role: 'user',
          content: `${prompt}${contextPrompt}`,
        },
      ],
      maxTokens: 2000,
    });

    return response.content;
  }

  /**
   * Convert image description to drawable elements
   */
  async describeImage(imageData: string): Promise<string> {
    // Note: For actual image analysis, you'd need to use Claude's vision capabilities
    // This is a simplified version
    const response = await this.chat({
      messages: [
        {
          role: 'user',
          content: 'Describe how to recreate this image as a simple diagram with basic shapes.',
        },
      ],
      maxTokens: 1000,
    });

    return response.content;
  }

  /**
   * Get smart suggestions based on current selection
   */
  async getSmartSuggestions(selectedElements: any[], allElements: any[]): Promise<string[]> {
    const context = {
      selected: selectedElements.length,
      total: allElements.length,
      types: [...new Set(selectedElements.map(el => el.type))],
    };

    const response = await this.chat({
      messages: [
        {
          role: 'user',
          content: `Based on this selection context: ${JSON.stringify(context)}
          
Provide 3-5 actionable suggestions for what the user might want to do next. Be specific and concise.
Format as a JSON array of strings.`,
        },
      ],
      maxTokens: 500,
    });

    try {
      let jsonContent = response.content.trim();
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(jsonContent);
    } catch {
      // Fallback to text split
      return response.content.split('\n').filter(s => s.trim());
    }
  }
}

export const aiService = new AIService();