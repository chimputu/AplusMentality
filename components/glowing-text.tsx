'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface GlowingTextProps {
  text: string;
  className?: string;
  fillColor?: string;
  glowColor?: string;
  strokeColor?: string;
  cycleDuration?: number;
}

export default function GlowingText({
  text,
  className = '',
  fillColor = '#3b82f6',
  glowColor = 'rgba(59, 130, 246, 0.9)',
  strokeColor = 'rgba(255, 255, 255, 0.35)',
  cycleDuration = 6,
}: GlowingTextProps) {
  const shouldReduceMotion = useReducedMotion();

  // If reduced motion preferred, show filled text instantly
  if (shouldReduceMotion) {
    return (
      <span
        className={className}
        aria-label={text}
        style={{
          color: fillColor,
          textShadow: `0 0 16px ${glowColor}`,
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-block ${className}`}
      aria-label={text}
    >
      {/* Ghost outline layer */}
      <span
        aria-hidden="true"
        className="absolute inset-0 select-none pointer-events-none"
        style={{
          WebkitTextStroke: `1.5px ${strokeColor}`,
          color: 'transparent',
        }}
      >
        {text}
      </span>

      {/* Animated fill layer — bidirectional */}
      <motion.span
        aria-hidden="true"
        className="relative inline-block"
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{
          clipPath: [
            'inset(0 100% 0 0)',   // start empty (fully hidden from right)
            'inset(0 0% 0 0)',     // full (visible) — L→R fill
            'inset(0 0% 0 100%)',  // hide from left — R→L retraction
            'inset(0 0% 0 0)',     // full again
            'inset(0 100% 0 0)',   // back to hidden right (reset)
          ],
        }}
        transition={{
          duration: cycleDuration,
          times: [0, 0.25, 0.5, 0.75, 1],
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          color: fillColor,
          textShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
          display: 'inline-block',
        }}
      >
        {text}
      </motion.span>
    </span>
  );
}
