// lib/attempt-policy.ts
// Compute whether a student can start an assessment attempt

interface AttemptRecord {
  id: string;
  attemptNumber: number;
  submittedAt: Date | null;
  score: number | null;
  startedAt: Date;
}

interface OverrideRecord {
  extraAttempts: number;
  waiveCooldown: boolean;
}

interface AttemptPolicyInput {
  attempts: AttemptRecord[];
  attemptsMax: number; // 0 = unlimited
  cooldownHrs: number;
  override?: OverrideRecord | null;
  now?: Date;
}

interface AttemptPolicyResult {
  canStart: boolean;
  reason?: string;
  attemptsUsed: number;
  attemptsMax: number | null; // null = unlimited
  attemptsLeft: number | null; // null = unlimited
  cooldownEndsAt: Date | null;
  bestScore: number | null;
}

export function computeAttemptPolicy({
  attempts,
  attemptsMax,
  cooldownHrs,
  override,
  now = new Date(),
}: AttemptPolicyInput): AttemptPolicyResult {
  const attemptsUsed = attempts.length;
  const effectiveMax = attemptsMax + (override?.extraAttempts ?? 0);
  const isUnlimited = attemptsMax === 0;

  // Find best score
  const submittedAttempts = attempts.filter(a => a.submittedAt && a.score !== null);
  const bestScore = submittedAttempts.length > 0
    ? Math.max(...submittedAttempts.map(a => a.score!))
    : null;

  // Check cooldown
  let cooldownEndsAt: Date | null = null;
  if (cooldownHrs > 0 && !override?.waiveCooldown && attempts.length > 0) {
    const lastAttempt = attempts.reduce((latest, a) =>
      a.startedAt > latest.startedAt ? a : latest
    );
    const cooldownEnd = new Date(lastAttempt.startedAt.getTime() + cooldownHrs * 60 * 60 * 1000);
    if (now < cooldownEnd) {
      cooldownEndsAt = cooldownEnd;
    }
  }

  // Determine if student can start
  if (cooldownEndsAt) {
    return {
      canStart: false,
      reason: 'Cooldown active',
      attemptsUsed,
      attemptsMax: isUnlimited ? null : effectiveMax,
      attemptsLeft: isUnlimited ? null : Math.max(0, effectiveMax - attemptsUsed),
      cooldownEndsAt,
      bestScore,
    };
  }

  if (!isUnlimited && attemptsUsed >= effectiveMax) {
    return {
      canStart: false,
      reason: 'Maximum attempts reached',
      attemptsUsed,
      attemptsMax: effectiveMax,
      attemptsLeft: 0,
      cooldownEndsAt: null,
      bestScore,
    };
  }

  return {
    canStart: true,
    attemptsUsed,
    attemptsMax: isUnlimited ? null : effectiveMax,
    attemptsLeft: isUnlimited ? null : Math.max(0, effectiveMax - attemptsUsed),
    cooldownEndsAt: null,
    bestScore,
  };
}
