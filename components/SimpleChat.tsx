'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';

export default function SimpleChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;
    
    setLoading(true);
    setResponse('');
    setError(null);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          result += chunk;
          setResponse(result);
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setError('Failed to get response. Please try again.');
      setResponse('');
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response]);

  const handleClose = () => {
    setIsOpen(false);
    setResponse('');
    setMessage('');
    setError(null);
  };

  return (
    <>
      {/* Floating Chat Button – Responsive */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '9999px',
          width: 'clamp(48px, 10vw, 60px)',
          height: 'clamp(48px, 10vw, 60px)',
          fontSize: 'clamp(20px, 5vw, 28px)',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
          zIndex: 999999,
          transition: 'transform 0.2s, background 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.background = '#1d4ed8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = '#2563eb';
        }}
        aria-label="Chat with AI Assistant"
      >
        🧠
      </button>

      {/* Chat Window – Responsive */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '160px',
            right: 'clamp(12px, 4vw, 24px)',
            width: 'min(92vw, 380px)',
            maxHeight: 'min(70vh, 500px)',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 999998,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#2563eb',
              color: 'white',
              padding: 'clamp(12px, 3vh, 16px) clamp(16px, 4vw, 20px)',
              fontWeight: 600,
              fontSize: 'clamp(14px, 3vw, 16px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: 'clamp(20px, 4vw, 24px)' }}>🧠</span>
              <span>A+ Study Assistant</span>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'background 0.2s',
                touchAction: 'manipulation',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: 'clamp(12px, 3vh, 16px)',
              maxHeight: 'calc(70vh - 120px)',
              overflowY: 'auto',
              background: '#f9fafb',
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {error ? (
              <div
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: 'clamp(13px, 2.5vw, 14px)',
                }}
              >
                ❌ {error}
              </div>
            ) : response ? (
              <div
                style={{
                  background: 'white',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  color: '#1a202c',
                  fontSize: 'clamp(13px, 2.5vw, 14px)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {response}
              </div>
            ) : (
              <div
                style={{
                  color: '#9ca3af',
                  textAlign: 'center',
                  padding: '20px 0',
                  fontSize: 'clamp(13px, 2.5vw, 14px)',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <span>Thinking... 🧠</span>
                ) : (
                  <span>
                    🧠 Ask me about courses, study tips,<br />
                    or Zambian universities!
                  </span>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: 'clamp(10px, 2vh, 12px) clamp(12px, 3vw, 16px)',
              borderTop: '1px solid #e5e7eb',
              background: 'white',
              display: 'flex',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your question..."
              style={{
                flex: 1,
                padding: 'clamp(8px, 2vh, 10px) clamp(10px, 2.5vw, 14px)',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none',
                fontSize: 'clamp(13px, 2.5vw, 14px)',
                minHeight: '40px',
              }}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              style={{
                padding: 'clamp(8px, 2vh, 10px) clamp(14px, 3vw, 20px)',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '40px',
                touchAction: 'manipulation',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#2563eb';
              }}
            >
              {loading ? '⏳' : <Send size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Add global animation styles */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @media (max-width: 480px) {
          .chat-button {
            bottom: 80px !important;
            right: 16px !important;
          }
          .chat-window {
            bottom: 140px !important;
            right: 8px !important;
            width: calc(100% - 16px) !important;
            max-height: 60vh !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
    </>
  );
}