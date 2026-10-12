'use client';

// Home-page AI Assistant — AWS-style floating widget
// Reuses the same chat API as AIAssistant but with a distinct orange AWS-style design
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Send, X, Sparkles, RefreshCw, Loader2, Mail,
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

const LAST_CONVO_KEY = 'ai:last-conversation-id';

function isValidConvoId(id: string | null): boolean {
  if (!id) return false;
  return /^c[a-z0-9]{20,}$/.test(id);
}

const PUBLIC_SUGGESTIONS = [
  'What is A+ Mentality?',
  'Which universities are supported?',
  'How do I sign up?',
  'Is it free?',
];

export function HomeAIAssistant() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isLoggedIn = isLoaded && isSignedIn;

  // Clear stale conversation when user changes
  useEffect(() => {
    if (!isLoaded) return;
    const lastUserId = localStorage.getItem('ai:user-id');
    const currentUserId = user?.id;
    if (lastUserId && currentUserId && lastUserId !== currentUserId) {
      localStorage.removeItem(LAST_CONVO_KEY);
      localStorage.removeItem('ai:user-id');
    }
    if (currentUserId) {
      localStorage.setItem('ai:user-id', currentUserId);
    }
  }, [isLoaded, user?.id]);

  // Initialize: fetch or create conversation
  useEffect(() => {
    if (!isLoaded) return;
    const isLoggedInNow = isLoaded && isSignedIn;

    // Restore last conversation from localStorage
    const saved = localStorage.getItem(LAST_CONVO_KEY);
    if (saved && isValidConvoId(saved)) {
      setConversationId(saved);
      // Load history
      (async () => {
        try {
          const convo = await getConversation(saved);
          if (convo && convo.messages && convo.messages.length) {
            const msgs: Message[] = convo.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
            }));
            setMessages(msgs);
          }
        } catch {
          // Silently fail — will create new conversation on next send
        }
      })();
    }

    // Send greeting
    const name = user?.firstName ?? '';
    const greeting = isLoggedInNow && name
      ? `Hi ${name}! 👋 I'm the A+ Mentality assistant. How can I help you today?`
      : "Hi there! 👋 I'm the A+ Mentality assistant. Ask me anything about our platform.";
    setMessages([{ id: 'greeting', role: 'assistant', content: greeting }]);
  }, [isLoaded, isSignedIn, user?.firstName]);

  const handleSend = async (suggestion?: string) => {
    const text = suggestion ?? input.trim();
    if (!text || loading) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      let convoId = conversationId;

      // Create conversation if needed
      if (!convoId || !isValidConvoId(convoId)) {
        const result = await createConversation({ title: text.slice(0, 100) });
        if (result && result.id) {
          convoId = result.id;
          setConversationId(convoId);
          localStorage.setItem(LAST_CONVO_KEY, convoId);
        }
      }

      // Send message via API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: convoId,
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };
      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: assistantContent } : m))
        );
      }

      // Save to DB
      if (convoId) {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: assistantContent,
            conversationId: convoId,
            role: 'assistant',
          }),
        }).catch(() => {});
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const errMsg = err.message ?? 'Something went wrong';
      setError(errMsg);
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    abortControllerRef.current?.abort();
    setConversationId(null);
    localStorage.removeItem(LAST_CONVO_KEY);
    const greeting = isLoggedIn && user?.firstName
      ? `Hi ${user.firstName}! 👋 Fresh start — what can I help with?`
      : "Fresh start! What would you like to know?";
    setMessages([{ id: 'greeting', role: 'assistant', content: greeting }]);
    setError(null);
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <>
      {/* AWS-style floating button — rounded square icon, orange gradient */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#ff9900] via-[#ff6600] to-[#cc5200] text-white shadow-[0_4px_16px_rgba(255,102,0,0.4),0_1px_3px_rgba(0,0,0,0.12)] border-2 border-white/20 flex items-center justify-center hover:shadow-[0_8px_25px_rgba(255,102,0,0.5),0_2px_6px_rgba(0,0,0,0.15)] hover:scale-108 hover:opacity-100 transition-all duration-300 ease-out active:scale-95"
        aria-label="Open AI assistant"
        title="A+ AI Assistant"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
            {/* AWS-style AI icon — hexagonal shape with sparkles */}
            <path d="M12 2L15.09 4.26L18.54 3.63L19.17 7.08L22 8.76L20.33 11.65L22 14.54L19.17 16.22L18.54 19.67L15.09 19.04L12 21.3L8.91 19.04L5.46 19.67L4.83 16.22L2 14.54L3.67 11.65L2 8.76L4.83 7.08L5.46 3.63L8.91 4.26L12 2Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M8 14C8 14 9.5 11 12 11C14.5 11 16 14 16 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9.5" cy="9" r="1" fill="white"/>
            <circle cx="14.5" cy="9" r="1" fill="white"/>
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed z-50 flex flex-col bottom-0 right-0 left-0 h-[70dvh] rounded-t-2xl md:right-6 md:left-auto md:bottom-24 md:w-96 md:h-[500px] md:rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* AWS-style header — orange gradient */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#ff9900] to-[#ff6600] text-white rounded-t-2xl md:rounded-t-xl flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
                  <Sparkles className="w-4 h-4" />
                  A+ Mentality Assistant
                </h3>
                <p className="text-xs text-orange-100">
                  {isLoggedIn ? `Logged in · A+ Mentality` : 'Public'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="p-1 rounded-full hover:bg-white/20 transition disabled:opacity-50"
                  aria-label="Start over"
                  title="Start over"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[80%] rounded-lg px-3 py-2 text-sm break-words ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-[#ff9900] to-[#ff6600] text-white'
                        : m.isError
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
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

              {/* Suggestion chips — AWS orange style */}
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {PUBLIC_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 rounded-full border-2 border-[#ff9900] text-[#cc5200] hover:bg-[#fff5e6] transition disabled:opacity-50 font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {error}
                    <button
                      onClick={() => setError(null)}
                      className="ml-1 hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-shrink-0 pb-safe">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about features…"
                disabled={loading}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#ff9900] focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-br from-[#ff9900] to-[#ff6600] text-white px-3 rounded-lg hover:from-[#ffaa00] hover:to-[#ff7700] transition disabled:opacity-50 active:scale-95 shadow-sm"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Support contact card — shown when chat is open */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 md:bottom-[520px] md:right-6">
          <a
            href="mailto:kafiswegchimputu@gmail.com"
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Mail className="w-3.5 h-3.5 text-[#ff6600]" />
            Need more help? Email us
          </a>
        </div>
      )}

      <style>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0.75rem);
        }
      `}</style>
    </>
  );
}
