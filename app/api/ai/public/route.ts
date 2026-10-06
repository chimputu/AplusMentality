import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/ai/openrouter';
import { buildPublicPrompt } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const reply = await chatWithAI({
      systemPrompt: buildPublicPrompt(),
      userMessage: message,
      maxTokens: 500,
    });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Public AI error:', err);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
