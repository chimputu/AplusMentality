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

// Validate conversation ID format (CUID: 'c' + 20+ alphanumeric chars)
function isValidConvoId(id: string | null): boolean {
  if (!id) return false;
  return /^c[a-z0-9]{20,}$/.test(id);
}

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

  // ── Clear stale conversation when user changes ──
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

  // ── Initialize: fetch or create conversation ──
  // IMPORTANT: DO NOT add firstName or isLoggedIn to deps — they cause the effect to re-run in a loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isLoaded) return;

    const isLoggedInNow = isLoaded && isSignedIn;

    if (!isLoggedInNow) {
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

    let cancelled = false;

    async function init() {
      try {
        // Step 1: Check localStorage
        let convoId = localStorage.getItem(LAST_CONVO_KEY);

        // Step 2: Validate the ID format
        if (convoId && !isValidConvoId(convoId)) {
          localStorage.removeItem(LAST_CONVO_KEY);
          convoId = null;
        }

        // Step 3: Fetch the conversation if we have a valid ID
        if (convoId) {
          const convo = await getConversation(convoId);

          if (cancelled) return;

          // Step 4: Handle missing conversation
          if (!convo) {
            localStorage.removeItem(LAST_CONVO_KEY);
            convoId = null;
          } else {
            setConversationId(convoId);
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
            return;
          }
        }

        // Step 5: Create a fresh conversation if needed
        if (!convoId && !cancelled) {
          try {
            const fresh = await createConversation({ mode: 'LOGGED_IN' });
            if (cancelled) return;

            setConversationId(fresh.id);
            localStorage.setItem(LAST_CONVO_KEY, fresh.id);
            setMessages([
              {
                id: 'greeting',
                role: 'assistant',
                content: `Hi ${firstName ?? 'there'}! 👋 I'm your A+ Mentality assistant. What can I help you with today?`,
              },
            ]);
          } catch (err) {
            console.error('[ai] Failed to create conversation:', err);
            setMessages([
              {
                id: 'greeting',
                role: 'assistant',
                content: `Hi ${firstName ?? 'there'}! 👋`,
              },
            ]);
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[ai] Init error:', err);
        // NEVER crash the parent — show fallback greeting
        setMessages([
          {
            id: 'greeting',
            role: 'assistant',
            content: `Hi there! 👋`,
          },
        ]);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

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
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition active:scale-95"
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
              className="bg-card rounded-xl shadow-2xl p-6 max-w-sm w-full border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Need more help?</h3>
                <button
                  onClick={() => setShowSupport(false)}
                  className="p-1 rounded-full hover:bg-muted  transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted  transition"
                >
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">Email</div>
                    <div className="text-xs text-muted-foreground truncate">{CONTACT.email}</div>
                  </div>
                </a>

                <a
                  href={`tel:${CONTACT.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted  transition"
                >
                  <Phone className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Call</div>
                    <div className="text-xs text-muted-foreground">{CONTACT.phoneDisplay}</div>
                  </div>
                </a>

                <a
                  href={CONTACT.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted  transition"
                >
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">WhatsApp</div>
                    <div className="text-xs text-muted-foreground">{CONTACT.phoneDisplay}</div>
                  </div>
                </a>
              </div>

              {isLoggedIn && user && (
                <>
                  <div className="mb-4 p-3 bg-muted dark:bg-background rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Your details (for faster support):</div>
                    <div className="text-xs text-foreground space-y-1">
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
                  className="flex-1 text-center px-3 py-2 text-sm bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition"
                >
                  Email
                </a>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="flex-1 text-center px-3 py-2 text-sm border border-border text-foreground rounded-lg hover:bg-muted  transition"
                >
                  Call
                </a>
                <a
                  href={CONTACT.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-3 py-2 text-sm bg-green-600 text-foreground rounded-lg hover:bg-green-700 transition"
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

          <div className="fixed z-50 flex flex-col bottom-0 right-0 left-0 h-[70dvh] rounded-t-2xl md:right-6 md:left-auto md:bottom-24 md:w-96 md:h-[500px] md:rounded-xl bg-card shadow-2xl border border-border">
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-blue-600 to-purple-600 text-foreground rounded-t-2xl md:rounded-t-xl flex items-center justify-between flex-shrink-0">
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
                  className="p-1 rounded-full hover:bg-card/20 transition"
                  aria-label="Contact support"
                  title="Need more help?"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="p-1 rounded-full hover:bg-card/20 transition disabled:opacity-50"
                  aria-label={isLoggedIn ? 'New conversation' : 'Start over'}
                  title={isLoggedIn ? 'New conversation' : 'Start over'}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-full hover:bg-card/20 transition"
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
                        ? 'bg-blue-600 text-foreground'
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
                  {suggestions.map((s) => (
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
                  <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
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
            <div className="p-3 border-t border-border flex gap-2 flex-shrink-0 pb-safe">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={placeholder}
                disabled={loading}
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-foreground px-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 active:scale-95"
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
