'use client';

// Unified AI Assistant component — replaces PublicChatbot and StudentChatbot
// Detects auth mode via Clerk's useUser() and adapts greeting, suggestions, and behavior
// Persists chat history for logged-in users via conversationId stored in localStorage
import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Send, X, MessageCircle, Sparkles, RefreshCw, Loader2,
  Mail, Phone, MessageSquare, Copy,
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

interface AIAssistantProps {
  userFirstName?: string | null;
  userRole?: string | null;
  userInstitution?: string | null;
  initialConversationId?: string | null;
}

const LAST_CONVO_KEY = 'ai:last-conversation-id';

// Contact info constants
const CONTACT = {
  email: 'kafiswegchimputu@gmail.com',
  phone: '+260772231300',
  phoneDisplay: '+260 77 223 1300',
  whatsappLink: 'https://wa.me/260772231300',
};

// Suggestion chips differ by mode
const PUBLIC_SUGGESTIONS = [
  'What is A+ Mentality?',
  'Which universities are supported?',
  'How do I sign up?',
  'Is it free?',
];

const LOGGED_IN_SUGGESTIONS = [
  'Show my courses',
  "What's due soon?",
  'How do I explore other universities?',
  'Take an assessment',
];

export function AIAssistant({
  userFirstName: propFirstName,
  userRole: propRole,
  userInstitution: propInstitution,
  initialConversationId,
}: AIAssistantProps = {}) {
  const { user, isSignedIn, isLoaded } = useUser();

  // Merge server-side props with client-side Clerk data
  const firstName = propFirstName ?? user?.firstName ?? null;
  const institution = propInstitution ?? null;

  const [open, setOpen] = useState(false);
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
  const [showSupport, setShowSupport] = useState(false);

  // ── Initialize: fetch or create conversation ──
  useEffect(() => {
    if (!isLoaded) return;

    if (!isLoggedIn) {
      // Public mode: greeting only, no persistence
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

    // Logged-in mode: load or create conversation
    async function init() {
      // 1. Try localStorage for last active conversation
      let convoId =
        initialConversationId ?? localStorage.getItem(LAST_CONVO_KEY);

      // 2. If none, create a fresh conversation
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

      // 3. Load messages from server
      if (convoId) {
        try {
          const convo = await getConversation(convoId);
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

  // ── Focus input when chat opens ──
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── ESC closes the panel ──
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, loading]);

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
        // Ensure a conversation exists for logged-in users
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

        // Retry with exponential backoff
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
      // Public mode: just clear local state
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

  const suggestions = isLoggedIn ? LOGGED_IN_SUGGESTIONS : PUBLIC_SUGGESTIONS;

  // ── Copy user details to clipboard ──
  const handleCopyDetails = () => {
    if (!isLoggedIn || !user) return;
    const details = `Name: ${user.firstName ?? 'N/A'} ${user.lastName ?? ''}\nEmail: ${user.emailAddresses[0]?.emailAddress ?? 'N/A'}\nInstitution: ${institution ?? 'N/A'}`;
    navigator.clipboard.writeText(details).then(() => {
      toast.success('Details copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy details');
    });
  };
  const placeholder = isLoggedIn
    ? 'Ask about your courses, assessments...'
    : 'Ask about features…';

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg flex items-center justify-center hover:opacity-90 transition active:scale-95"
        aria-label="Open AI assistant"
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Support dialog */}
      {open && showSupport && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSupport(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Need more help?</h3>
                <button
                  onClick={() => setShowSupport(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</div>
                    <div className="text-xs text-gray-500 truncate">{CONTACT.email}</div>
                  </div>
                </a>

                <a
                  href={`tel:${CONTACT.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <Phone className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Call</div>
                    <div className="text-xs text-gray-500">{CONTACT.phoneDisplay}</div>
                  </div>
                </a>

                <a
                  href={CONTACT.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">WhatsApp</div>
                    <div className="text-xs text-gray-500">{CONTACT.phoneDisplay}</div>
                  </div>
                </a>
              </div>

              {isLoggedIn && user && (
                <>
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-2">Your details (for faster support):</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                      <div>• Name: {user.firstName ?? 'N/A'} {user.lastName ?? ''}</div>
                      <div>• Email: {user.emailAddresses[0]?.emailAddress ?? 'N/A'}</div>
                      <div>• Institution: {institution ?? 'N/A'}</div>
                    </div>
                    <button
                      onClick={handleCopyDetails}
                      className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <Copy className="w-3 h-3" />
                      Copy my details
                    </button>
                  </div>
                </>
              )}

              {!isLoggedIn && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">🔓 Sign up to unlock:</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <div>• In-app support</div>
                    <div>• Faster responses</div>
                    <div>• Personalized help</div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex-1 text-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Email
                </a>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="flex-1 text-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Call
                </a>
                <a
                  href={CONTACT.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  WhatsApp
                </a>
              </div>

              {!isLoggedIn && (
                <a
                  href="/sign-up"
                  className="block mt-3 text-center px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                >
                  Sign up
                </a>
              )}
            </div>
          </div>
        </>
      )}

      {/* Chat panel */}
      {open && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed z-50 flex flex-col bottom-0 right-0 left-0 h-[70dvh] rounded-t-2xl md:right-6 md:left-auto md:bottom-24 md:w-96 md:h-[500px] md:rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl md:rounded-t-xl flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  A+ Mentality Assistant
                </h3>
                <p className="text-xs text-blue-100">
                  {isLoggedIn
                    ? `Logged in · ${institution ?? 'A+ Mentality'}`
                    : 'Public'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSupport(true)}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                  aria-label="Contact support"
                  title="Need more help?"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="p-1 rounded-full hover:bg-white/20 transition disabled:opacity-50"
                  aria-label={isLoggedIn ? 'New conversation' : 'Start over'}
                  title={isLoggedIn ? 'New conversation' : 'Start over'}
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
                        ? 'bg-blue-600 text-white'
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

              {/* Suggestion chips — show only on greeting */}
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
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
                placeholder={placeholder}
                disabled={loading}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 active:scale-95"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
      <style>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0.75rem);
        }
      `}</style>
    </>
  );
}
