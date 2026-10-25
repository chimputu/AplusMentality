'use client';

// Full-page AI Assistant — used on /student/ai
// Renders the chat as a full-page experience instead of a floating widget
import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Send, MessageCircle, Sparkles, RefreshCw, Loader2,
} from 'lucide-react';
import { createConversation, getConversation } from '@/lib/actions/chat';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

interface AIAssistantPageProps {
  userFirstName?: string | null;
  userRole?: string | null;
  userInstitution?: string | null;
  initialConversationId?: string | null;
}

const LAST_CONVO_KEY = 'ai:last-conversation-id';

const SUGGESTIONS = [
  'What is A+ Mentality?',
  'Show my courses',
  "What's due soon?",
  'Take an assessment',
];

export function AIAssistantPage({
  userFirstName: propFirstName,
  userRole: propRole,
  userInstitution: propInstitution,
  initialConversationId,
}: AIAssistantPageProps = {}) {
  const { user, isSignedIn, isLoaded } = useUser();

  const firstName = propFirstName ?? user?.firstName ?? null;
  const institution = propInstitution ?? null;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isLoggedIn = isLoaded && isSignedIn;

  // ── Initialize: fetch or create conversation ──
  useEffect(() => {
    if (!isLoaded) return;

    if (!isLoggedIn) {
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content:
            '👋 Welcome to A+ Mentality! I can tell you about our platform. What would you like to know?',
        },
      ]);
      return;
    }

    async function init() {
      let convoId =
        initialConversationId ?? localStorage.getItem(LAST_CONVO_KEY);

      if (!convoId) {
        try {
          const convo = await createConversation({ mode: 'LOGGED_IN' });
          convoId = convo.id;
          localStorage.setItem(LAST_CONVO_KEY, convoId);
        } catch {
          convoId = null;
        }
      }

      setConversationId(convoId);

      if (convoId) {
        try {
          const convo = await getConversation(convoId);
          // Conversation was deleted or doesn't exist — clear stale ID and start fresh
          if (!convo) {
            localStorage.removeItem(LAST_CONVO_KEY);
            setConversationId(null);
            const newConvo = await createConversation({ mode: 'LOGGED_IN' });
            setConversationId(newConvo.id);
            localStorage.setItem(LAST_CONVO_KEY, newConvo.id);
            setMessages([
              {
                id: 'greeting',
                role: 'assistant',
                content: `Hi ${firstName ?? 'there'}! 👋 I'm your A+ Mentality assistant. What can I help you with today?`,
              },
            ]);
            return;
          }
          if (convo.messages.length === 0) {
            setMessages([
              {
                id: 'greeting',
                role: 'assistant',
                content: `Hi ${firstName ?? 'there'}! 👋 I'm your A+ Mentality assistant. What can I help you with today?`,
              },
            ]);
          } else {
            setMessages(
              convo.messages.map((m: any) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                isError: m.isError,
              }))
            );
          }
        } catch {
          // If loading fails, clear stale ID and show empty state
          localStorage.removeItem(LAST_CONVO_KEY);
          setMessages([]);
        }
      }
    }

    init();
  }, [isLoaded, isLoggedIn, firstName, initialConversationId]);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Focus input on mount ──
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // ── Send message ──
  const handleSend = useCallback(
    async (text?: string, retryCount = 0) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;
      if (content.length > 2000) {
        setError('Message too long');
        return;
      }

      setError(null);

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
      };

      setMessages((prev) => (retryCount === 0 ? [...prev, userMsg] : prev));
      setInput('');
      setLoading(true);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        let convoId = conversationId;
        if (isLoggedIn && !convoId) {
          const convo = await createConversation({ mode: 'LOGGED_IN' });
          convoId = convo.id;
          setConversationId(convoId);
          localStorage.setItem(LAST_CONVO_KEY, convoId);
        }

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg]
              .filter((m) => m.id !== 'greeting')
              .map((m) => ({ role: m.role, content: m.content })),
            conversationId: convoId,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!data.content) throw new Error('Empty response');

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.content,
          },
        ]);
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        if (retryCount < 2) {
          setTimeout(() => handleSend(content, retryCount + 1), 1500);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              "Sorry, I couldn't reach the server. Please check your connection and try again.",
            isError: true,
          },
        ]);
        setError('Connection failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, conversationId, isLoggedIn]
  );

  // ── New conversation / reset ──
  const handleReset = async () => {
    if (loading) return;
    abortControllerRef.current?.abort();

    if (isLoggedIn) {
      try {
        const convo = await createConversation({ mode: 'LOGGED_IN' });
        setConversationId(convo.id);
        localStorage.setItem(LAST_CONVO_KEY, convo.id);
        setMessages([
          {
            id: 'greeting',
            role: 'assistant',
            content: `Hi ${firstName ?? 'there'}! 👋 New conversation started. What can I help you with?`,
          },
        ]);
        toast.success('New conversation started');
      } catch {
        toast.error('Could not start a new conversation');
      }
    } else {
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content:
            '👋 Welcome to A+ Mentality! I can tell you about our platform. What would you like to know?',
        },
      ]);
    }
    setError(null);
    setInput('');
    inputRef.current?.focus();
  };

  const placeholder = isLoggedIn
    ? 'Ask about your courses, assessments...'
    : 'Ask about features…';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-semibold flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5" />
            A+ Mentality Assistant
          </h2>
          <p className="text-xs text-blue-100">
            {isLoggedIn
              ? `Logged in · ${institution ?? 'A+ Mentality'}`
              : 'Public'}
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={loading}
          className="p-2 rounded-full hover:bg-card/20 transition disabled:opacity-50"
          aria-label={isLoggedIn ? 'New conversation' : 'Start over'}
          title={isLoggedIn ? 'New conversation' : 'Start over'}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm break-words ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : m.isError
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : 'bg-muted text-foreground'
              }`}
            >
              {m.role === 'assistant' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <strong>{children}</strong>,
                    h2: ({ children }) => <strong>{children}</strong>,
                    h3: ({ children }) => <strong>{children}</strong>,
                    h4: ({ children }) => <strong>{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {/* Suggestion chips — show only on greeting */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-border dark:border-border text-muted-foreground dark:text-foreground hover:bg-muted  transition disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 border border-border rounded-lg px-4 py-3 text-sm bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 active:scale-95"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
