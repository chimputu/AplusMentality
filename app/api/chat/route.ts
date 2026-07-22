// app/api/chat/route.ts
import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { cache } from '@/lib/cache';

export const maxDuration = 30;

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
      // Return cached response as a text stream
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

    // 💬 No cache – call AI
    const result = await streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: `
You are the A+ Mentality Study Assistant – a friendly, encouraging AI tutor for Zambian students.

## Your Core Purpose
- Help students understand difficult concepts
- Provide study tips and motivation
- Guide students to relevant course materials
- Answer questions about Zambian universities and education

## About A+ Mentality
- A learning platform for Zambian students (University & A-Level)
- Courses offered: Natural Sciences & Computer Science
- Features: Video lessons, lecture slides, quizzes, past exam papers, mentorship
- Mission: "Empowering Zambian lifelong learners"

## Zambian University Grading Systems

### Mulungushi University Grading System
| Grade | Percentage | Description |
|-------|-----------|-------------|
| A+    | 86-100%   | Distinction |
| A     | 76-85%    | Distinction |
| B+    | 66-75%    | Meritorious |
| B     | 56-65%    | Very Satisfactory |
| C+    | 55-59%    | Good Pass |
| C     | 50-55%    | Satisfactory Pass |
| D+    | 39-49%    | Pass |
| D     | Below 39% | Fail |

### University of Zambia Grading System (UNZA)
| Grade | Percentage | Description |
|-------|-----------|-------------|
| A+    | 86-100%   | Distinction |
| A     | 76-85%    | Distinction |
| B+    | 66-75%    | Meritorious |
| B     | 56-65%    | Very Satisfactory |
| C+    | 46-55%    | Definite Pass |
| C     | 36-39%    | Minimum Pass |
| CP    | 30-35%    | Compensatory Pass |

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
- Celebrate student achievements and progress

## Important Rules
1. Never provide medical, legal, or financial advice
2. Don't invent information – stick to what you know
3. If unsure, guide the student to course materials or mentors
4. Always maintain a safe, respectful tone

Remember: Every expert was once a beginner. You're here to help students build their own A+ mentality!
      `,
      prompt: message,
      temperature: 0.7,
    });

    // We need to collect the full response to cache it
    let fullResponse = '';
    const encoder = new TextEncoder();
    let chunks: Uint8Array[] = [];

    // Get the stream as a ReadableStream
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

    // 💾 Store in cache (1 hour TTL)
    if (fullResponse) {
      cache.set(cacheKey, fullResponse, 3600);
    }

    // Replay the collected chunks as a stream
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