'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { X, Send, Bot, User as UserIcon, Loader2, Copy, Check, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTED_QUESTIONS = [
  'What grade do I need for a distinction at Mulungushi?',
  'Explain limits in Calculus I',
  'How do I study for Physics I effectively?',
  'What is a variable in programming?',
];

// ─── Code Block Component ────────────────────────────────────────────────────

function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = () => {
    const text = typeof children === 'string' ? children : children?.toString() || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-border">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-card px-4 py-1.5 text-xs text-muted-foreground">
        <span className="font-medium lowercase">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <div className="bg-background overflow-x-auto">
        <pre className="px-4 py-3 text-sm leading-relaxed text-foreground">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}

// ─── Inline Code Component ───────────────────────────────────────────────────

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="bg-muted dark:bg-card px-1.5 py-0.5 rounded text-sm font-mono text-pink-500">
      {children}
    </code>
  );
}

// ─── Main Chat Component ─────────────────────────────────────────────────────

export default function SimpleChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const sendMessage = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setError(null);
    setInput('');

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const assistantIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            updated[assistantIndex] = { role: 'assistant', content: result };
            return updated;
          });
        }
      }

      if (!result.trim()) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            role: 'assistant',
            content: "Hmm, I couldn't generate a response. Please try again.",
          };
          return updated;
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get a response. Please try again.');
      setMessages((prev) => prev.slice(0, assistantIndex));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
    setInput('');
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-[9999] w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group active:scale-95"
        aria-label="Open AI Study Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <Bot className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
          </>
        )}
      </button>

      {/* Chat Window — full screen on mobile, fixed panel on desktop */}
      {isOpen && (
        <div
          className="fixed inset-0 sm:inherit sm:bottom-20 sm:right-6 sm:left-auto sm:w-[420px] md:w-[460px] sm:max-h-[calc(100vh-100px)] z-[9998] bg-card sm:rounded-2xl shadow-2xl sm:border sm:border-border dark:sm:border-border flex flex-col overflow-hidden"
          style={{ animation: 'chatSlideUp 0.25s ease-out' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-card/20 rounded-full flex items-center justify-center relative">
                <Bot className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-blue-600 dark:border-blue-700" />
              </div>
              <div>
                <div className="font-semibold text-sm">A+ Study Assistant</div>
                <div className="text-xs text-blue-100 dark:text-blue-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Online · Always here to help
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-blue-100 dark:text-blue-200 hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-card/10 transition"
                  aria-label="Clear chat"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-card/15 transition"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-muted dark:bg-background min-h-0"
          >
            {/* Empty state */}
            {messages.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Bot className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground dark:text-foreground text-lg mb-1">
                  Hi there! 👋
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-[300px] mx-auto">
                  I&apos;m your A+ Study Assistant. Ask me anything about your first-year modules.
                </p>
                <div className="space-y-2 max-w-[320px] mx-auto">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="block w-full text-left text-sm text-foreground bg-card hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-border dark:border-border hover:border-blue-300 dark:hover:border-blue-700 rounded-xl px-4 py-3 transition shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow">
                    <Bot className="w-4 h-4 text-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[min(85%,560px)] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
                    msg.role === 'user'
                      ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-br-md'
                      : 'bg-card text-foreground border border-border dark:border-border rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : msg.content ? (
                    <div className="[&>p]:mb-2 [&>p]:last:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>pre]:mb-2 [&>h1]:text-base [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-sm [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-2 [&>h4]:text-sm [&>h4]:font-semibold [&>hr]:my-3 [&>blockquote]:border-l-2 [&>blockquote]:border-blue-500 [&>blockquote]:pl-3 [&>blockquote]:text-muted-foreground [&>blockquote]:dark:text-muted-foreground [&>table]:text-xs [&>table]:w-full [&>table]:my-2 [&>th]:bg-muted [&>th]:dark:bg-card [&>th]:px-2 [&>th]:py-1 [&>td]:px-2 [&>td]:py-1 [&>td]:border [&>td]:border-border [&>td]:dark:border-border [&>a]:text-blue-500 [&>a]:underline [&>strong]:text-foreground [&>strong]:dark:text-foreground [&>code]:bg-muted [&>code]:dark:bg-card [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-pink-500 [&>code]:text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        pre: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>,
                        code: ({ className, children, ...props }) => {
                          // If it's a block code (has pre parent), let pre handle it
                          if (className?.includes('language-')) {
                            return <span>{children}</span>;
                          }
                          return <InlineCode {...props}>{children}</InlineCode>;
                        },
                      }}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 py-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow">
                    <UserIcon className="w-4 h-4 text-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
                ⚠️ {error}
              </div>
            )}

            {/* Loading indicator at bottom */}
            {loading && messages[messages.length - 1]?.content && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow">
                  <Bot className="w-4 h-4 text-foreground" />
                </div>
                <div className="bg-card border border-border dark:border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Scroll to bottom button */}
          {messages.length > 3 && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-36 sm:bottom-32 right-1/2 sm:right-6 translate-x-1/2 sm:translate-x-0 bg-card border border-border rounded-full p-2 shadow-lg hover:bg-muted  transition z-10"
              aria-label="Scroll to bottom"
            >
              <ChevronUp className="w-4 h-4 text-muted-foreground dark:text-foreground" />
            </button>
          )}

          {/* Input Area */}
          <div className="border-t border-border dark:border-border bg-card p-3 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... (Shift+Enter for new line)"
                disabled={loading}
                rows={1}
                className="flex-1 px-4 py-2.5 bg-muted dark:bg-background border border-border dark:border-border focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm text-foreground dark:text-foreground placeholder-gray-400 outline-none transition disabled:opacity-60 resize-none max-h-[120px] overflow-y-auto"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-muted disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition active:scale-95 flex-shrink-0 mb-0.5"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground dark:text-muted-foreground text-center mt-2">
              AI can make mistakes. Verify important info with your lecturer.
            </p>
          </div>
        </div>
      )}

      {/* Animation */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
