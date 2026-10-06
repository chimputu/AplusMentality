'use client';

import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';

export function AIChat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Study Assistant. I know your courses, scores, and available tutors. Ask me anything about your studies!",
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
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          AI Study Assistant
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          I know your performance, courses, and tutors. Ask me for help.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 px-4 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask me how to improve in any course…"
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={send}
          disabled={loading}
          className="bg-blue-600 text-white px-5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
}
