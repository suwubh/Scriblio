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

/* --------------------------------- Icons --------------------------------- */
type IconProps = React.SVGProps<SVGSVGElement>;

const Sparkles = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path
      d="M12 3c.7 5 2.9 7.2 8 8-5.1.8-7.3 3-8 8-.7-5-2.9-7.2-8-8 5.1-.8 7.3-3 8-8Z"
      fill="currentColor"
    />
    <path
      d="M19 3c.2 1.7.9 2.5 2.6 2.8-1.7.3-2.4 1.1-2.6 2.8-.2-1.7-.9-2.5-2.6-2.8C17.1 5.5 17.8 4.7 19 3Z"
      fill="currentColor"
      opacity=".5"
    />
  </svg>
);

const ChatIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path
      d="M20 11.4a7.6 7.6 0 0 1-11 6.8L4.5 19.5l1.3-4.4A7.6 7.6 0 1 1 20 11.4Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const SummarizeIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M6 3h7l5 5v13H6Z" />
    <path d="M13 3v5h5" />
    <path d="M9 12.5h6M9 16.5h4" />
  </svg>
);

const BoltIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M13 2 5 13h5l-1 9 9-12h-5l1-8Z" fill="currentColor" />
  </svg>
);

const ArrowUpIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 20V5M6 11l6-6 6 6" />
  </svg>
);

const CloseIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" {...p}>
    <path d="M6 6 18 18M18 6 6 18" />
  </svg>
);

const TrashIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 13h9.4l.8-13" />
  </svg>
);

const UserIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="8.5" r="3.7" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

const WarningIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3 22 20H2L12 3Z" />
    <path d="M12 10v4.5M12 17.6h.01" />
  </svg>
);

const Spinner = (p: IconProps) => (
  <svg className="ai-spinner" viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" opacity=".25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/* Quick-action glyphs */
const ShapesIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" {...p}>
    <rect x="3" y="6" width="11" height="9" rx="2" />
    <rect x="10" y="10" width="11" height="8" rx="2" />
  </svg>
);

const FlowIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="7" y="3" width="10" height="6" rx="1.6" />
    <rect x="7" y="15" width="10" height="6" rx="1.6" />
    <path d="M12 9v6" />
  </svg>
);

const CirclesIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
    <circle cx="7" cy="9" r="3.3" />
    <circle cx="16" cy="7" r="2.7" />
    <circle cx="13.5" cy="16.5" r="3.6" />
  </svg>
);

const MindmapIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...p}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="4.5" cy="5" r="2" />
    <circle cx="19.5" cy="5" r="2" />
    <circle cx="4.5" cy="19" r="2" />
    <circle cx="19.5" cy="19" r="2" />
    <path d="M9.8 10.1 6.1 6.4M14.2 10.1 17.9 6.4M9.8 13.9 6.1 17.6M14.2 13.9 17.9 17.6" />
  </svg>
);

const HierarchyIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="9" y="3" width="6" height="5" rx="1.2" />
    <rect x="2.5" y="15" width="6" height="5" rx="1.2" />
    <rect x="15.5" y="15" width="6" height="5" rx="1.2" />
    <path d="M12 8v3.5M5.5 15v-3.5h13V15" />
  </svg>
);

/* --------------------------------- Config -------------------------------- */
const MODES: { id: AIMode; label: string; Icon: (p: IconProps) => React.ReactElement }[] = [
  { id: 'generate', label: 'Generate', Icon: Sparkles },
  { id: 'chat', label: 'Chat', Icon: ChatIcon },
  { id: 'summarize', label: 'Summarize', Icon: SummarizeIcon },
  { id: 'optimize', label: 'Optimize', Icon: BoltIcon },
];

const QUICK_ACTIONS: { Icon: (p: IconProps) => React.ReactElement; title: string; prompt: string }[] = [
  { Icon: ShapesIcon, title: 'Row of rectangles', prompt: 'Create 3 blue rectangles in a horizontal line' },
  { Icon: FlowIcon, title: 'Flowchart', prompt: 'Make a simple flowchart with 4 steps' },
  { Icon: CirclesIcon, title: 'Pentagon of circles', prompt: 'Draw 5 circles arranged in a pentagon' },
  { Icon: MindmapIcon, title: 'Mind map', prompt: 'Create a mind map with a center node and 4 branches' },
  { Icon: HierarchyIcon, title: 'Org chart', prompt: 'Make a simple org chart with 3 levels' },
];

const WELCOME: Record<AIMode, { title: string; text: string }> = {
  generate: { title: 'Bring ideas to life', text: 'Describe what you want and watch it appear on your canvas.' },
  chat: { title: 'Ask me anything', text: 'Brainstorm, get design advice, or talk through your diagram.' },
  summarize: { title: 'Summarize your canvas', text: 'Get a clear written overview of everything you have drawn.' },
  optimize: { title: 'Refine your layout', text: 'Get concrete suggestions to improve spacing and structure.' },
};

const PLACEHOLDER: Record<AIMode, string> = {
  generate: 'Describe what you want to create…',
  chat: 'Ask me anything…',
  summarize: 'Press Enter to summarize your canvas…',
  optimize: 'Press Enter for layout suggestions…',
};

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

  // Clear error after a while
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

            // Transform AI elements to full Scriblio elements
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
                fillStyle: (el.fillStyle ?? 'hachure') as 'hachure' | 'solid' | 'cross-hatch',
                strokeWidth: el.strokeWidth ?? 2,
                strokeStyle: (el.strokeStyle ?? 'solid') as 'solid' | 'dashed' | 'dotted',
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
            response = `Created ${elementsToAdd.length} element${elementsToAdd.length !== 1 ? 's' : ''} on your canvas.`;
          } catch (genError: any) {
            console.error('Generation error:', genError);

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

  if (!isOpen) return null;

  const modeIndex = MODES.findIndex(m => m.id === mode);
  const canSubmit = isLoading || (!input.trim() && mode !== 'summarize' && mode !== 'optimize');

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div
        className="ai-modal"
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant"
        onClick={e => e.stopPropagation()}
      >
        {/* Ambient aurora glow */}
        <div className="ai-modal-aurora" aria-hidden="true" />

        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-brand-mark" aria-hidden="true">
            <Sparkles />
          </div>
          <div className="ai-brand-text">
            <h2 className="ai-modal-title">AI Assistant</h2>
            <span className="ai-modal-subtitle">Generate &amp; refine your canvas</span>
          </div>
          <div className="ai-modal-actions">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="ai-icon-btn"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <TrashIcon />
              </button>
            )}
            <button
              onClick={onClose}
              className="ai-icon-btn ai-close-btn"
              title="Close (Esc)"
              aria-label="Close AI Assistant"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="ai-mode-selector" role="tablist" aria-label="AI mode">
          <span
            className="ai-mode-thumb"
            style={{ transform: `translateX(calc(${modeIndex} * 100%))` }}
            aria-hidden="true"
          />
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              className={`ai-mode-btn ${mode === id ? 'active' : ''}`}
              onClick={() => setMode(id)}
            >
              <span className="ai-mode-icon"><Icon /></span>
              <span className="ai-mode-label">{label}</span>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="ai-messages" role="log" aria-live="polite">
          {messages.length === 0 && !isLoading && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon" aria-hidden="true">
                <Sparkles />
              </div>
              <h3 className="ai-welcome-title">{WELCOME[mode].title}</h3>
              <p className="ai-welcome-text">{WELCOME[mode].text}</p>

              {mode === 'generate' && (
                <div className="ai-quick-actions">
                  <span className="ai-quick-label">Suggestions</span>
                  <div className="ai-quick-list">
                    {QUICK_ACTIONS.map(({ Icon, title, prompt }, i) => (
                      <button
                        key={i}
                        className="ai-quick-action-btn"
                        onClick={() => handleQuickAction(prompt)}
                      >
                        <span className="ai-quick-icon"><Icon /></span>
                        <span className="ai-quick-body">
                          <span className="ai-quick-title">{title}</span>
                          <span className="ai-quick-sub">{prompt}</span>
                        </span>
                        <span className="ai-quick-enter" aria-hidden="true">↵</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`ai-message ai-message-${msg.role}`}>
              <div className="ai-message-avatar" aria-hidden="true">
                {msg.role === 'user' ? <UserIcon /> : <Sparkles />}
              </div>
              <div className="ai-message-content">{msg.content}</div>
            </div>
          ))}

          {isLoading && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-avatar" aria-hidden="true">
                <Sparkles />
              </div>
              <div className="ai-message-content">
                <div className="ai-loading" aria-hidden="true">
                  <span className="ai-loading-dot" />
                  <span className="ai-loading-dot" />
                  <span className="ai-loading-dot" />
                </div>
                <div className="ai-loading-text">
                  {mode === 'generate' ? 'Creating your diagram…' : 'Thinking…'}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="ai-error" role="alert">
              <span className="ai-error-icon" aria-hidden="true"><WarningIcon /></span>
              <span className="ai-error-text">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ai-error-dismiss"
                aria-label="Dismiss error"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form id="ai-form" className="ai-input-form" onSubmit={handleSubmit}>
          <div className="ai-input-wrap">
            <span className="ai-input-icon" aria-hidden="true"><Sparkles /></span>
            <input
              ref={inputRef}
              type="text"
              className="ai-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={PLACEHOLDER[mode]}
              aria-label="AI prompt input"
            />
          </div>
          <button
            type="submit"
            className="ai-submit-btn"
            disabled={canSubmit}
            aria-label="Send message"
          >
            {isLoading ? <Spinner /> : <ArrowUpIcon />}
          </button>
        </form>

        {/* Footer */}
        <div className="ai-footer">
          <span className="ai-footer-chip">
            <strong>{elements.length}</strong> element{elements.length !== 1 ? 's' : ''}
          </span>
          {selectedElements.length > 0 && (
            <span className="ai-footer-chip">
              <strong>{selectedElements.length}</strong> selected
            </span>
          )}
          <span className="ai-footer-spacer" />
          <span className="ai-footer-hint">
            <kbd>Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};
