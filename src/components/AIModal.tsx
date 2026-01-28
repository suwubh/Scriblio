// src/components/AIModal.tsx
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
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message
    const newMessages: AIMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let response: string;

      switch (mode) {
        case 'summarize':
          response = await aiService.summarizeCanvas(JSON.stringify(elements, null, 2));
          break;

        case 'generate':
          const generatedElements = await aiService.generateDiagram({
            prompt: userMessage,
            canvasContext: elements.length > 0 ? `Current canvas has ${elements.length} elements` : undefined,
          });
          
          // Convert to Excalidraw format and add to canvas
          const elementsToAdd = generatedElements.map((el: any, index: number) => ({
            ...el,
            id: `ai-gen-${Date.now()}-${index}`,
            angle: 0,
            fillStyle: 'hachure' as const,
            strokeWidth: 2,
            strokeStyle: 'solid' as const,
            roughness: 1,
            opacity: 1,
            seed: Math.floor(Math.random() * 1000000),
            versionNonce: Math.floor(Math.random() * 1000000),
            isDeleted: false,
            groupIds: [],
            updated: Date.now(),
          }));

          onAddElements(elementsToAdd);
          response = `✅ Generated ${elementsToAdd.length} elements based on your request!`;
          break;

        case 'optimize':
          response = await aiService.optimizeLayout(JSON.stringify(elements, null, 2));
          break;

        default: // chat
          response = await aiService.generateContent(
            userMessage,
            elements.length > 0 ? `Canvas has ${elements.length} elements` : undefined
          );
      }

      setMessages([
        ...newMessages,
        { role: 'assistant', content: response },
      ]);
    } catch (err) {
      console.error('AI Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMessages(newMessages); // Keep user message even on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setMode('generate');
    setInput(action);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const form = document.querySelector('#ai-form') as HTMLFormElement;
      form?.requestSubmit();
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
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-modal-header">
          <h2>🤖 AI Assistant</h2>
          <button className="ai-close-btn" onClick={onClose} aria-label="Close AI Assistant">
            ✕
          </button>
        </div>

        {/* Mode Selector */}
        <div className="ai-mode-selector">
          <button
            className={`ai-mode-btn ${mode === 'chat' ? 'active' : ''}`}
            onClick={() => setMode('chat')}
          >
            💬 Chat
          </button>
          <button
            className={`ai-mode-btn ${mode === 'summarize' ? 'active' : ''}`}
            onClick={() => setMode('summarize')}
          >
            📊 Summarize
          </button>
          <button
            className={`ai-mode-btn ${mode === 'generate' ? 'active' : ''}`}
            onClick={() => setMode('generate')}
          >
            ✨ Generate
          </button>
          <button
            className={`ai-mode-btn ${mode === 'optimize' ? 'active' : ''}`}
            onClick={() => setMode('optimize')}
          >
            🎯 Optimize
          </button>
        </div>

        {/* Messages Area */}
        <div className="ai-messages">
          {messages.length === 0 && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">🎨</div>
              <h3>Welcome to Scriblio AI Assistant!</h3>
              <p>I can help you:</p>
              <ul>
                <li>💬 Answer questions about your canvas</li>
                <li>📊 Summarize what you've drawn</li>
                <li>✨ Generate diagrams and shapes</li>
                <li>🎯 Optimize your layout</li>
              </ul>
              
              {mode === 'generate' && (
                <div className="ai-quick-actions">
                  <p><strong>Quick actions:</strong></p>
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="ai-quick-action-btn"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`ai-message ${message.role === 'user' ? 'ai-message-user' : 'ai-message-assistant'}`}
            >
              <div className="ai-message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="ai-message-content">
                {message.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-avatar">🤖</div>
              <div className="ai-message-content">
                <div className="ai-loading">
                  <span className="ai-loading-dot"></span>
                  <span className="ai-loading-dot"></span>
                  <span className="ai-loading-dot"></span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="ai-error">
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form id="ai-form" className="ai-input-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="ai-input"
            placeholder={
              mode === 'chat' ? 'Ask me anything...' :
              mode === 'summarize' ? 'Press Enter to summarize canvas...' :
              mode === 'generate' ? 'Describe what you want to create...' :
              'Press Enter to get optimization tips...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="ai-submit-btn"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? '⏳' : '🚀'}
          </button>
        </form>

        {/* Footer Info */}
        <div className="ai-footer">
          <span>Canvas: {elements.length} elements</span>
          {selectedElements.length > 0 && (
            <span>• Selected: {selectedElements.length}</span>
          )}
          <span>• Powered by Claude AI</span>
        </div>
      </div>
    </div>
  );
};