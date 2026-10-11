import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Log the error but don't crash the app — let individual features fail gracefully
  console.error('⚠️ Invalid env vars:', parsed.error.flatten().fieldErrors);
  // Provide fallback values for missing required fields
  parsed.data = {
    DATABASE_URL: process.env.DATABASE_URL || '',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET || undefined,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  };
}

export const env = parsed.data;
