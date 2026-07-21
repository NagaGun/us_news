/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, MessageSquare, Sparkles } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  isLoading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick-click prompt chips
// ─────────────────────────────────────────────────────────────────────────────

const PROMPT_CHIPS = [
  {
    id: 'chip-staffing-gap',
    label: '📊 Analyze staffing gap',
    query:
      'Compare our current nurse staffing ratio against the 75th percentile of our peer group. What operational adjustment will it take to bridge this gap, and what is the predicted SMR impact?',
  },
  {
    id: 'chip-process-update',
    label: '🔄 Project process update',
    query:
      'If we implement an automated expert consult trigger to increase our consult rate from 80% to 95%, how will that dynamically distribute weights and affect our overall Operations score?',
  },
  {
    id: 'chip-staffing-drop',
    label: '⚠️ Simulate staffing drop',
    query:
      'If our nurse-to-patient staffing ratio degrades from 6.5 to 7.5 due to a temporary shortage, how will our predicted SMR and Clinical Outcomes score react?',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Render simple markdown-ish formatting: **bold**, bullet lists, newlines
function renderBoldParts(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={j}>{part.slice(2, -2)}</strong>;
    }
    return <span key={j}>{part}</span>;
  });
}

function renderContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('- ')) {
      // Bullet line: strip the leading dash and render bold parts within it
      return (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            <span style={{ color: '#60a5fa', flexShrink: 0 }}>•</span>
            <span>{renderBoldParts(line.slice(2))}</span>
          </div>
        </React.Fragment>
      );
    }
    return (
      <React.Fragment key={i}>
        <div style={{ marginTop: i > 0 ? '6px' : 0 }}>{renderBoldParts(line)}</div>
      </React.Fragment>
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles (inline for zero external CSS dependency)
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = {
  toggleBtn: {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '52px',
    height: '52px',
    background: 'linear-gradient(135deg, #1e293b 0%, #1d4ed8 100%)',
    color: '#f8fafc',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '50%',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(29,78,216,0.35), 0 2px 8px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(12px)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  panel: {
    position: 'fixed' as const,
    bottom: '76px',
    right: '20px',
    width: '380px',
    height: '550px',
    zIndex: 9998,
    display: 'flex',
    flexDirection: 'column' as const,
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#f8fafc',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    background: '#1e293b',
    color: '#f8fafc',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 6px #22c55e88',
  },
  headerTitle: {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.01em',
    color: '#f1f5f9',
  },
  headerSub: {
    fontSize: '10px',
    color: '#94a3b8',
    marginTop: '1px',
    fontWeight: 500,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8',
    borderRadius: '8px',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    lineHeight: 1,
    transition: 'background 0.15s, color 0.15s',
  },
  messageArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    background: '#f8fafc',
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    padding: '9px 13px',
    background: '#1d4ed8',
    color: '#fff',
    borderRadius: '14px 14px 4px 14px',
    fontSize: '12.5px',
    lineHeight: '1.5',
    wordBreak: 'break-word' as const,
    boxShadow: '0 2px 8px rgba(29,78,216,0.2)',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    padding: '10px 13px',
    background: '#fff',
    color: '#1e293b',
    borderRadius: '14px 14px 14px 4px',
    fontSize: '12.5px',
    lineHeight: '1.6',
    wordBreak: 'break-word' as const,
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  loadingDot: {
    display: 'inline-block',
    animation: 'chatPulse 1.2s ease-in-out infinite',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    padding: '8px 12px 0',
    background: '#f8fafc',
    flexShrink: 0,
  },
  chip: {
    padding: '5px 10px',
    background: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '50px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    lineHeight: 1.4,
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    padding: '10px 12px 12px',
    background: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#fff',
    color: '#1e293b',
    outline: 'none',
    resize: 'none' as const,
  },
  sendBtn: {
    padding: '8px 14px',
    background: '#1d4ed8',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.15s',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    flexShrink: 0,
  },
  footer: {
    padding: '8px 14px 10px',
    background: '#f1f5f9',
    borderTop: '1px solid #e2e8f0',
    fontSize: '9.5px',
    color: '#94a3b8',
    lineHeight: 1.5,
    flexShrink: 0,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Welcome message shown before any interaction
// ─────────────────────────────────────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm your Clinical Operations Assistant. I can help you analyze staffing gaps, project score changes from process improvements, and simulate operational scenarios.\n\nUse a quick chip below or type your own question.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chipHover, setChipHover] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSubmitting) return;

      const userMsg: Message = { id: generateId(), role: 'user', content: trimmed };
      const loadingId = generateId();
      const loadingMsg: Message = {
        id: loadingId,
        role: 'assistant',
        content: 'Thinking…',
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setInputValue('');
      setIsSubmitting(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, hospital_id: 'HOSP_A' }),
        });

        const data = await res.json();
        const responseText =
          data.response ||
          'I cannot answer that question. My access is strictly sandboxed to our facility\'s metrics and aggregated peer benchmarks.';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId ? { ...m, content: responseText, isLoading: false } : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content:
                    'Unable to reach the operations server. Please ensure the backend is running on port 5000.',
                  isLoading: false,
                }
              : m
          )
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes chatPulse {
          0%, 100% { opacity: 0.3; } 50% { opacity: 1; }
        }
        #chat-toggle-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(29,78,216,0.45), 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        #chat-send-btn:hover { background: #1e40af !important; }
        #chat-close-btn:hover { background: rgba(255,255,255,0.15) !important; color: #f1f5f9 !important; }
      `}</style>

      {/* ── Toggle Button (Icon Only Logo) ── */}
      <button
        id="chat-toggle-btn"
        style={STYLES.toggleBtn}
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Close Operations Assistant' : 'Open Operations Assistant'}
      >
        <Bot style={{ width: '24px', height: '24px' }} />
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          id="chat-panel"
          style={{
            ...STYLES.panel,
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
          }}
          role="dialog"
          aria-label="Clinical Operations Assistant"
        >
          {/* ─ Header ─ */}
          <div id="chat-header" style={STYLES.header}>
            <div style={STYLES.headerLeft}>
              <div style={STYLES.headerDot} />
              <div>
                <div style={STYLES.headerTitle}>Clinical Operations Assistant</div>
                <div style={STYLES.headerSub}>Sandboxed to facility metrics & peer benchmarks</div>
              </div>
            </div>
            <button
              id="chat-close-btn"
              style={STYLES.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          {/* ─ Message Area ─ */}
          <div id="chat-message-area" style={STYLES.messageArea}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                id={`chat-msg-${msg.id}`}
                style={msg.role === 'user' ? STYLES.userBubble : STYLES.aiBubble}
              >
                {msg.isLoading ? (
                  <span>
                    Thinking
                    <span style={{ ...STYLES.loadingDot, animationDelay: '0s' }}>.</span>
                    <span style={{ ...STYLES.loadingDot, animationDelay: '0.2s' }}>.</span>
                    <span style={{ ...STYLES.loadingDot, animationDelay: '0.4s' }}>.</span>
                  </span>
                ) : (
                  renderContent(msg.content)
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ─ Quick-Click Chips ─ */}
          <div id="chat-chips-row" style={STYLES.chipsRow}>
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip.id}
                id={chip.id}
                data-query={chip.query}
                style={{
                  ...STYLES.chip,
                  background: chipHover === chip.id ? '#eff6ff' : '#fff',
                  borderColor: chipHover === chip.id ? '#93c5fd' : '#cbd5e1',
                  color: chipHover === chip.id ? '#1d4ed8' : '#334155',
                }}
                onMouseEnter={() => setChipHover(chip.id)}
                onMouseLeave={() => setChipHover(null)}
                onClick={() => sendMessage(chip.query)}
                disabled={isSubmitting}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* ─ Input Row ─ */}
          <div id="chat-input-row" style={STYLES.inputRow}>
            <textarea
              ref={inputRef}
              id="chat-text-input"
              style={{ ...STYLES.input, height: '36px', lineHeight: '20px' }}
              placeholder="Ask about staffing, scores, or simulations…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              rows={1}
              aria-label="Message input"
            />
            <button
              id="chat-send-btn"
              style={{
                ...STYLES.sendBtn,
                opacity: isSubmitting || !inputValue.trim() ? 0.5 : 1,
                cursor: isSubmitting || !inputValue.trim() ? 'not-allowed' : 'pointer',
              }}
              onClick={() => sendMessage(inputValue)}
              disabled={isSubmitting || !inputValue.trim()}
              aria-label="Send message"
            >
              Send
            </button>
          </div>

          {/* ─ Regulatory Footer ─ */}
          <div id="chat-regulatory-footer" style={STYLES.footer}>
            ⚠️ This assistant provides simulated, statistical predictions for administrative
            performance scoring. It is not a clinical decision-making tool, does not provide
            medical advice, and does not alter patient care protocols.
          </div>
        </div>
      )}
    </>
  );
}
