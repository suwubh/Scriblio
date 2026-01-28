import React, { useState, useRef, useEffect } from 'react';
import { aiService, AIMessage } from '../services/aiService';
import { ExcalidrawElement } from '../types/excalidraw';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ExcalidrawElement[];
  selectedElements: ExcalidrawElement[];
  onAddElements: (elements: Partial<ExcalidrawElement>[]) => void;
}

type AIMode = 'chat' | 'summarize' | 'generate' | 'optimize';

export const AIModal: React.FC<AIModalProps> = ({
  isOpen,
  onClose,
  elements,
  selectedElements,
  onAddElements,
}) => {
  const [mode, setMode] = useState<AIMode>('chat');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    const newMessages: AIMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let response = '';

      switch (mode) {
        case 'summarize': {
          response = await aiService.summarizeCanvas(
            JSON.stringify(elements, null, 2)
          );
          break;
        }

        case 'generate': {
          const context =
            elements.length > 0
              ? `Current canvas has ${elements.length} elements`
              : undefined;

          // ✅ ALWAYS pass a STRING
          const prompt = context
            ? `${userMessage}\n\n${context}`
            : userMessage;

          const generatedElements = await aiService.generateDiagram(prompt);

          const elementsToAdd = generatedElements.map(
            (el: any, index: number) => ({
              ...el,
              id: `ai-gen-${Date.now()}-${index}`,
              angle: 0,
              fillStyle: 'hachure' as const,
              strokeWidth: 2,
              strokeStyle: 'solid' as const,
              roughness: 1,
              opacity: 1,
              seed: Math.floor(Math.random() * 1_000_000),
              versionNonce: Math.floor(Math.random() * 1_000_000),
              isDeleted: false,
              groupIds: [],
              updated: Date.now(),
            })
          );

          onAddElements(elementsToAdd);
          response = `✅ Generated ${elementsToAdd.length} elements`;
          break;
        }

        case 'optimize': {
          response = await aiService.optimizeLayout(
            JSON.stringify(elements, null, 2)
          );
          break;
        }

        default: {
          response = await aiService.generateContent(
            userMessage,
            elements.length > 0
              ? `Canvas has ${elements.length} elements`
              : undefined
          );
        }
      }

      setMessages([
        ...newMessages,
        { role: 'assistant', content: response },
      ]);
    } catch (err) {
      console.error('AI Error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setMode('generate');
    setInput(action);
    setTimeout(() => {
      document
        .querySelector<HTMLFormElement>('#ai-form')
        ?.requestSubmit();
    }, 100);
  };

  const quickActions = [
    'Create a flowchart for user authentication',
    'Draw a simple mind map about project planning',
    'Generate a timeline with 5 milestones',
    'Create an organizational chart',
    'Draw a simple database schema',
  ];

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-modal-header">
          <h2>🤖 AI Assistant</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* Mode Selector */}
        <div className="ai-mode-selector">
          {(['chat', 'summarize', 'generate', 'optimize'] as AIMode[]).map(
            m => (
              <button
                key={m}
                className={mode === m ? 'active' : ''}
                onClick={() => setMode(m)}
              >
                {m.toUpperCase()}
              </button>
            )
          )}
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {messages.length === 0 && mode === 'generate' && (
            <div className="ai-quick-actions">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`ai-message ${
                m.role === 'user' ? 'user' : 'assistant'
              }`}
            >
              <strong>{m.role === 'user' ? '👤' : '🤖'}</strong>
              <span>{m.content}</span>
            </div>
          ))}

          {isLoading && <div className="ai-loading">Thinking…</div>}

          {error && <div className="ai-error">⚠️ {error}</div>}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form id="ai-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={
              mode === 'generate'
                ? 'Describe what you want to create…'
                : 'Ask something…'
            }
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            🚀
          </button>
        </form>

        {/* Footer */}
        <div className="ai-footer">
          <span>Canvas: {elements.length}</span>
          {selectedElements.length > 0 && (
            <span> • Selected: {selectedElements.length}</span>
          )}
          <span> • Powered by OpenAI / Groq</span>
        </div>
      </div>
    </div>
  );
};
