import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).refine(
    (val) => {
      try { new URL(val); return true; } catch { return false; }
    },
    { message: 'DATABASE_URL must be a valid URL (e.g. postgresql://...)' }
  ),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default('http://localhost:3000'),
  // AI features — optional; missing key means AI chat will fail gracefully at runtime
  OPENROUTER_API_KEY: z.string().optional(),
  // File upload features — optional; missing keys mean uploads will fail gracefully at runtime
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.flatten().fieldErrors;
  console.error('⚠️ Invalid env vars:', missing);

  // Fail fast in production for critical missing vars — a silent empty string
  // causes cryptic 500 errors at runtime (e.g. Prisma connection refused).
  const criticalFields: string[] = ['DATABASE_URL', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
  const criticalMissing = criticalFields.filter((key) => missing[key as keyof typeof missing]?.length);

  if (criticalMissing.length > 0) {
    console.error(
      `🚨 Missing critical env vars: ${criticalMissing.join(', ')}. ` +
      `The app will not function correctly. Set these in your deployment environment variables.`
    );
  }

  // Warn about missing optional but important feature keys
  const featureFields: Record<string, string> = {
    OPENROUTER_API_KEY: 'AI chat and insights features',
    CLOUDINARY_CLOUD_NAME: 'File upload features (tutor photos, past papers)',
    CLOUDINARY_API_KEY: 'File upload features (tutor photos, past papers)',
    CLOUDINARY_API_SECRET: 'File upload features (tutor photos, past papers)',
  };
  const featureMissing = Object.keys(featureFields).filter(
    (key) => !process.env[key as keyof typeof process.env]
  );
  if (featureMissing.length > 0) {
    const featuresAffected = [...new Set(featureMissing.map((k) => featureFields[k]))];
    console.warn(
      `⚠️ Missing optional env vars: ${featureMissing.join(', ')}. ` +
      `Affected features: ${featuresAffected.join('; ')}. ` +
      `These features will fail gracefully at runtime.`
    );
  }
}

export const env = parsed.success ? parsed.data : {
  DATABASE_URL: process.env.DATABASE_URL || '',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
