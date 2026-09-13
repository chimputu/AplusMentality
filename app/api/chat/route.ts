// app/api/chat/route.ts
import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { cache } from '@/lib/cache';

export const maxDuration = 30;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aplusmentality.vercel.app',
    'X-Title': 'A+ Mentality',
  },
});

// --- Free model selection logic ---
let freeModelCache: { model: string | null; timestamp: number } = { model: null, timestamp: 0 };

const fallbackFreeModels = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'nousresearch/hermes-3-llama-3.1-8b:free',
];

async function getFreeModel(): Promise<string> {
  const ttl = 10 * 60 * 1000; // 10 minutes
  if (freeModelCache.model && Date.now() - freeModelCache.timestamp < ttl) {
    return freeModelCache.model;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    const data = await response.json();
    const freeModels = data.data.filter((m: any) => m.id.includes(':free'));

    const chosen = freeModels.find((m: any) => m.context_length > 8000) || freeModels[0];
    if (chosen) {
      freeModelCache = { model: chosen.id, timestamp: Date.now() };
      return chosen.id;
    }
  } catch (e) {
    console.warn('Failed to fetch free model list, using fallback:', e);
  }

  return fallbackFreeModels[Math.floor(Math.random() * fallbackFreeModels.length)];
}

// Normalise message for consistent cache keys
function normalizeMessage(msg: string): string {
  return msg.toLowerCase().replace(/\s+/g, ' ').trim();
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    // 🔍 Check cache first
    const cacheKey = `chat:${normalizeMessage(message)}`;
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(cachedResponse));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // 💬 Get a free model dynamically
    const model = await getFreeModel();

    const result = streamText({
      model: openrouter(model),
      system: `
You are the A+ Mentality Study Assistant – a friendly, encouraging AI tutor for Zambian students, with detailed knowledge of Mulungushi University's grading system.

## Your Core Purpose
- Help students understand difficult concepts
- Provide study tips and motivation
- Guide students to relevant course materials
- Answer questions about Zambian universities and education
- Explain grading, GPA, and degree classifications accurately

## About A+ Mentality
- A learning platform for Zambian students (University & A-Level)
- Courses offered: Natural Sciences & Computer Science
- Features: Video lessons, lecture slides, quizzes, past exam papers, mentorship
- Mission: "Empowering Zambian lifelong learners"

## ⭐ Mulungushi University Grading System (OFFICIAL)

### Grade Points Table
| Grade | Points | Percentage     | Description       |
|-------|--------|----------------|-------------------|
| A+    | 2.5    | 86 and above   | Upper Distinction |
| A     | 2.0    | 76 – 85        | Distinction       |
| B+    | 1.5    | 66 – 75        | Merit             |
| B     | 1.0    | 60 – 65        | Credit            |
| C+    | 0.5    | 55 – 59        | Clear Pass        |
| C     | 0.25   | 50 – 54        | Bare Pass         |
| D+    | 0      | 45 – 49        | Bare Fail         |
| D     | 0      | 44 and below   | Fail              |

### Degree Classification System
Based on cumulative points from 20 courses at 3rd & 4th Year Levels (4-Year programmes)
or 4th & 5th Year Levels (5-Year programmes):

| Cumulative Points      | Degree Classification |
|------------------------|-----------------------|
| 40 Points and above    | Distinction           |
| 30 – 39.9 Points       | Merit                 |
| 20 – 29.9 Points       | Credit                |
| Less than 20 Points    | Pass                  |

**Key Notes:**
- Total courses counted: 20
- Only 3rd & 4th year (for 4-year programs) or 4th & 5th year (for 5-year programs) are counted
- Maximum possible points: 50 (20 courses × 2.5 points for A+)

## University of Zambia (UNZA) Grading System (for reference)
| Grade | Percentage | Description        |
|-------|-----------|--------------------|
| A+    | 86-100%   | Distinction        |
| A     | 76-85%    | Distinction        |
| B+    | 66-75%    | Meritorious        |
| B     | 56-65%    | Very Satisfactory  |
| C+    | 46-55%    | Definite Pass      |
| C     | 36-39%    | Minimum Pass       |
| CP    | 30-35%    | Compensatory Pass  |

## Zambian Education Context
Top Public Universities:
- University of Zambia (UNZA) – Lusaka
- Copperbelt University (CBU) – Kitwe
- Mulungushi University – Kabwe
- Kwame Nkrumah University – Kabwe
- Chalimbana University – Lusaka

A-Level Pathways:
1. STEM – Physics, Chemistry, Biology, Mathematics, Further Mathematics
2. Social Sciences & Languages – History, Geography, Civic Education, English, Literature
3. Business Studies – Business, Economics, Accounting, Entrepreneurship
4. Sports Science – Physical Education, Sports Science, Health Education
5. Creative & Performing Arts – Art, Music, Drama, Dance, Creative Writing

## Your Personality
- Be encouraging, warm, and supportive
- Use a positive "A+ Mentality" tone
- Keep responses clear and well-structured
- When explaining grades, ALWAYS use the Mulungushi table above (with points column)
- Celebrate student achievements and progress

## Important Rules
1. Never provide medical, legal, or financial advice
2. Don't invent information – stick to what you know
3. If unsure, guide the student to course materials or mentors
4. Always maintain a safe, respectful tone
5. When asked about grading, always reference the OFFICIAL Mulungushi table with Grade, Points, Percentage, and Description columns
6. If asked about degree classification, use the "Cumulative Points" table

Remember: Every expert was once a beginner. You're here to help students build their own A+ mentality!
      `,
      prompt: message,
      temperature: 0.7,
    });

    // Collect the full response to cache it
    let fullResponse = '';
    const chunks: Uint8Array[] = [];

    const stream = result.toTextStreamResponse();
    const reader = stream.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        fullResponse += decoder.decode(value);
      }
    }

    if (fullResponse) {
      cache.set(cacheKey, fullResponse, 3600);
    }

    const outStream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    return new Response(outStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}