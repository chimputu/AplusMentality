'use client';

import { useState } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';

export function StudentChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: 'assistant',
      content: "Hi! I'm your study assistant. Ask me how to improve in any course!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    setMessages((m) => [...m, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((m) => [...m, { role: 'assistant', content: `Error: ${data.error}` }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg flex items-center justify-center hover:opacity-90 transition"
        aria-label="Open AI assistant"
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Study Assistant
            </h3>
            <p className="text-xs text-blue-100">I know your performance</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="How can I improve in CS 101?"
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={send}
              disabled={loading}
              className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
