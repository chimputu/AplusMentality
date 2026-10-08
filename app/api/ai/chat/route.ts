// Unified AI chat endpoint — replaces /api/ai/public and /api/ai/student
// Determines mode via getAIContext(), persists messages for logged-in users
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { chatWithAI } from '@/lib/ai/openrouter';
import { getAIContext } from '@/lib/ai/context';
import { PUBLIC_PROMPT } from '@/lib/ai/prompts/public';
import { LOGGED_IN_PROMPT } from '@/lib/ai/prompts/logged-in';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { messages, conversationId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Limit history to prevent abuse — keep last 20 messages, 4000 chars each
    const trimmedMessages = messages.slice(-20).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content ?? '').slice(0, 4000),
    }));

    const context = await getAIContext();

    // Select prompt based on mode, with template replacement for logged-in
    const systemPrompt =
      context.mode === 'PUBLIC'
        ? PUBLIC_PROMPT
        : LOGGED_IN_PROMPT
            .replace('{{userFirstName}}', context.firstName ?? 'there')
            .replace('{{userInstitution}}', context.institution ?? 'not set')
            .replace('{{userRole}}', context.role ?? 'STUDENT')
            .replace('{{userOnboarded}}', String(context.onboarded));

    // Build full conversation context for the AI
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...trimmedMessages,
    ];

    // Use OpenRouter (existing client) instead of OpenAI
    const content = await chatWithAI({
      systemPrompt: aiMessages[0].content,
      userMessage: JSON.stringify(aiMessages.slice(1)),
      maxTokens: 800,
    });

    if (!content) {
      return NextResponse.json(
        { error: 'No response from assistant' },
        { status: 502 }
      );
    }

    // ── Persist for logged-in users (fire-and-forget, never fails the request) ──
    if (userId && conversationId) {
      try {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (user) {
          const conversation = await prisma.chatConversation.findFirst({
            where: { id: conversationId, userId: user.id },
          });

          if (conversation) {
            // Save both the last user message + the assistant reply
            const lastUserMessage = trimmedMessages
              .filter((m: any) => m.role === 'user')
              .pop();

            await prisma.$transaction([
              prisma.chatMessage.createMany({
                data: [
                  ...(lastUserMessage
                    ? [{
                        conversationId,
                        role: 'user',
                        content: lastUserMessage.content,
                      }]
                    : []),
                  {
                    conversationId,
                    role: 'assistant',
                    content,
                  },
                ],
              }),
              prisma.chatConversation.update({
                where: { id: conversationId },
                data: {
                  lastMessageAt: new Date(),
                  // Auto-title on first user message if still default
                  ...(conversation.title === 'New conversation' &&
                    lastUserMessage && {
                      title: lastUserMessage.content.slice(0, 60),
                    }),
                },
              }),
            ]);
          }
        }
      } catch (persistError) {
        // Never fail the request if persistence fails
        console.error('Chat persist error:', persistError);
      }
    }

    return NextResponse.json({
      content,
      mode: context.mode,
    });
  } catch (err: any) {
    console.error('AI chat error:', err);

    if (err?.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
