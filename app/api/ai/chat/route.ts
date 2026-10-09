// Unified AI chat endpoint — replaces /api/ai/public and /api/ai/student
// Determines mode via getAIContext(), persists messages for logged-in users
// Injects factual constraints and validates AI responses to prevent hallucinations
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { chatWithAI } from '@/lib/ai/openrouter';
import { getAIContext } from '@/lib/ai/context';
import { PUBLIC_PROMPT } from '@/lib/ai/prompts/public';
import { LOGGED_IN_PROMPT } from '@/lib/ai/prompts/logged-in';
import { PLATFORM_FACTS } from '@/lib/ai/platform-facts';
import { validateAIResponse } from '@/lib/ai/validate-response';

export const dynamic = 'force-dynamic';

// Build the dynamic facts block injected into the system prompt at request time
function buildFactsBlock(): string {
  const f = PLATFORM_FACTS;
  const featuresList = Object.entries(f.features)
    .filter(([_, v]) => v)
    .map(([k]) => `  ✅ ${k.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`)
    .join('\n');

  const nonFeaturesList = Object.entries(f.nonFeatures)
    .filter(([_, v]) => v)
    .map(([k]) => `  ❌ ${k.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`)
    .join('\n');

  const institutionsList = f.institutions
    .map((i) => `  - ${i.name} (${i.shortName}) — ${i.city}`)
    .join('\n');

  const forbiddenList = f.forbiddenClaims
    .map((c) => `  ❌ ${c}`)
    .join('\n');

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REAL FACTS ABOUT A+ MENTALITY (ONLY STATE THESE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IDENTITY:
  Name: ${f.name}
  Country: ${f.country}
  Tagline: ${f.tagline}
  Scope: ${f.scope}
  Expansion: ${f.expansion}

NUMBERS:
  Institutions: ${f.institutionCount}
  Users: ${f.userCount}
  Courses: ${f.courseCount}

INSTITUTIONS (this is the COMPLETE list — no others exist):
${institutionsList}

FEATURES THAT EXIST:
${featuresList}

FEATURES THAT DO NOT EXIST YET:
${nonFeaturesList}

PRICING:
  Model: ${f.pricing.model}
  Student cost: ${f.pricing.studentCost}
  Public pricing: ${f.pricing.publicPricing}

⚠️ FORBIDDEN CLAIMS (NEVER SAY ANY OF THESE):
${forbiddenList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IF ASKED about something NOT in this block:
  → "I don't have that information. Please contact
     support@aplusmentality.com."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

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

    // Select base prompt based on mode, with template replacement for logged-in
    const basePrompt =
      context.mode === 'PUBLIC'
        ? PUBLIC_PROMPT
        : LOGGED_IN_PROMPT
            .replace('{{userFirstName}}', context.firstName ?? 'there')
            .replace('{{userInstitution}}', context.institution ?? 'not set')
            .replace('{{userRole}}', context.role ?? 'STUDENT')
            .replace('{{userOnboarded}}', String(context.onboarded));

    // Inject facts block into the system prompt
    const factsBlock = buildFactsBlock();
    const systemPrompt = `${factsBlock}\n\n${basePrompt}`;

    // Use OpenRouter with proper message array for conversation context
    const content = await chatWithAI({
      systemPrompt,
      messages: trimmedMessages,
      maxTokens: 800,
    });

    if (!content) {
      return NextResponse.json(
        { error: 'No response from assistant' },
        { status: 502 }
      );
    }

    // Validate AI response to catch any hallucinations that slipped through
    const { text: validatedContent, wasFiltered } = validateAIResponse(content);

    // Log to Sentry if response was filtered
    if (wasFiltered) {
      Sentry.captureMessage('AI hallucination filtered by post-processing', {
        level: 'warning',
        extra: { originalResponse: content },
      });
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
                    content: validatedContent,
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
      content: validatedContent,
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
