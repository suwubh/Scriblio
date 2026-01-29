// src/components/AIModal.tsx - IMPROVED VERSION

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

interface MessageWithId extends AIMessage {
  id: string;
  timestamp: number;
}

export const AIModal: React.FC<AIModalProps> = ({
  isOpen,
  onClose,
  elements,
  selectedElements,
  onAddElements,
}) => {
  const [mode, setMode] = useState<AIMode>('generate');
  const [messages, setMessages] = useState<MessageWithId[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string): MessageWithId => {
    const message: MessageWithId = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    // Add user message
    addMessage('user', userMessage);

    try {
      let response = '';

      switch (mode) {
        case 'summarize': {
          const elementsJson = JSON.stringify(elements, null, 2);
          response = await aiService.summarizeCanvas(elementsJson);
          break;
        }

        case 'generate': {
          const context = elements.length > 0
            ? `\n\nContext: Canvas currently has ${elements.length} elements.`
            : '';

          const fullPrompt = userMessage + context;

          try {
            const generatedElements = await aiService.generateDiagram(fullPrompt);

            if (!Array.isArray(generatedElements) || generatedElements.length === 0) {
              throw new Error('No elements were generated');
            }

            // Transform AI elements to full Excalidraw elements
            const elementsToAdd = generatedElements.map((el: any, index: number) => {
              // Calculate position in a grid if not specified
              const gridX = 100 + (index % 4) * 180;
              const gridY = 100 + Math.floor(index / 4) * 150;

              return {
                ...el,
                id: `ai-gen-${Date.now()}-${index}`,
                x: el.x ?? gridX,
                y: el.y ?? gridY,
                width: el.width ?? 140,
                height: el.height ?? 100,
                angle: el.angle ?? 0,
                strokeColor: el.strokeColor ?? '#000000',
                backgroundColor: el.backgroundColor ?? 'transparent',
                fillStyle: (el.fillStyle ?? 'hachure') as const,
                strokeWidth: el.strokeWidth ?? 2,
                strokeStyle: (el.strokeStyle ?? 'solid') as const,
                roughness: el.roughness ?? 1,
                opacity: el.opacity ?? 1,
                seed: Math.floor(Math.random() * 1_000_000),
                versionNonce: Math.floor(Math.random() * 1_000_000),
                isDeleted: false,
                groupIds: [],
                updated: Date.now(),
              };
            });

            onAddElements(elementsToAdd);
            response = `✨ Successfully created ${elementsToAdd.length} element${elementsToAdd.length !== 1 ? 's' : ''} on your canvas!`;
          } catch (genError: any) {
            console.error('Generation error:', genError);
            
            // Provide helpful error message
            let errorMsg = 'Failed to generate diagram. ';
            
            if (genError.message.includes('JSON')) {
              errorMsg += 'The AI had trouble formatting the response. Try a simpler description like "Create 3 blue rectangles in a row".';
            } else if (genError.message.includes('timeout') || genError.message.includes('took too long')) {
              errorMsg += 'The request took too long. Try describing something simpler.';
            } else if (genError.message.includes('Network')) {
              errorMsg += 'Cannot connect to AI service. Please check your connection.';
            } else {
              errorMsg += genError.message || 'Please try again with a different description.';
            }
            
            throw new Error(errorMsg);
          }
          break;
        }

        case 'optimize': {
          const elementsJson = JSON.stringify(elements, null, 2);
          response = await aiService.optimizeLayout(elementsJson);
          break;
        }

        default: {
          const context = elements.length > 0
            ? `\n\nCanvas has ${elements.length} elements`
            : undefined;
          response = await aiService.generateContent(userMessage, context);
        }
      }

      addMessage('assistant', response);
    } catch (err) {
      console.error('AI Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = useCallback((action: string) => {
    setMode('generate');
    setInput(action);
    setTimeout(() => {
      inputRef.current?.focus();
      const form = document.querySelector<HTMLFormElement>('#ai-form');
      form?.requestSubmit();
    }, 100);
  }, []);

  const handleClear = useCallback(() => {
    if (messages.length > 0 && !window.confirm('Clear all messages?')) {
      return;
    }
    setMessages([]);
    setError(null);
  }, [messages.length]);

  const quickActions = [
    'Create 3 blue rectangles in a horizontal line',
    'Make a simple flowchart with 4 steps',
    'Draw 5 circles arranged in a pentagon',
    'Create a mind map with a center node and 4 branches',
    'Make a simple org chart with 3 levels',
  ];

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-modal-header">
          <h2>✨ AI Assistant</h2>
          <div className="ai-modal-actions">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="ai-clear-btn"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                🗑️
              </button>
            )}
            <button
              onClick={onClose}
              className="ai-close-btn"
              aria-label="Close AI Assistant"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="ai-mode-selector" role="tablist">
          {(['generate', 'chat', 'summarize', 'optimize'] as AIMode[]).map(m => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={`ai-mode-btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'generate' && '✨ '}
              {m === 'chat' && '💬 '}
              {m === 'summarize' && '📝 '}
              {m === 'optimize' && '⚡ '}
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="ai-messages" role="log" aria-live="polite">
          {messages.length === 0 && !isLoading && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">🤖</div>
              <h3>Welcome to AI Assistant</h3>
              <p>
                {mode === 'generate' && 'Describe what you want to create, and I\'ll add it to your canvas!'}
                {mode === 'chat' && 'Ask me anything about your diagram or design ideas.'}
                {mode === 'summarize' && 'I\'ll summarize your current canvas for you.'}
                {mode === 'optimize' && 'I\'ll suggest improvements for your layout and design.'}
              </p>
              
              {mode === 'generate' && (
                <div className="ai-quick-actions">
                  <p><strong>Try these examples:</strong></p>
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
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

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`ai-message ai-message-${msg.role}`}
            >
              <div className="ai-message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="ai-message-content">{msg.content}</div>
            </div>
          ))}

          {isLoading && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-avatar">🤖</div>
              <div className="ai-message-content">
                <div className="ai-loading">
                  <div className="ai-loading-dot"></div>
                  <div className="ai-loading-dot"></div>
                  <div className="ai-loading-dot"></div>
                </div>
                <div className="ai-loading-text">
                  {mode === 'generate' ? 'Creating your diagram...' : 'Thinking...'}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="ai-error" role="alert">
              <strong>⚠️ Error:</strong> {error}
              <button 
                onClick={() => setError(null)}
                className="ai-error-dismiss"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form id="ai-form" className="ai-input-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="ai-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={
              mode === 'generate'
                ? 'Describe what you want to create...'
                : mode === 'summarize'
                ? 'Press Enter to summarize your canvas...'
                : mode === 'optimize'
                ? 'Press Enter for layout suggestions...'
                : 'Ask me anything...'
            }
            aria-label="AI prompt input"
          />
          <button
            type="submit"
            className="ai-submit-btn"
            disabled={isLoading || (!input.trim() && mode !== 'summarize' && mode !== 'optimize')}
            aria-label="Send message"
          >
            {isLoading ? '⏳' : '🚀'}
          </button>
        </form>

        {/* Footer */}
        <div className="ai-footer">
          <span>Canvas: {elements.length} element{elements.length !== 1 ? 's' : ''}</span>
          {selectedElements.length > 0 && (
            <span>• Selected: {selectedElements.length}</span>
          )}
          <span>• Mode: {mode}</span>
        </div>
      </div>
    </div>
  );
};