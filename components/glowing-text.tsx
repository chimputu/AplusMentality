'use client';

import { useEffect, useRef, useState } from 'react';

interface GlowingTextProps {
  text: string;
  duration?: number;
  color?: string;
  className?: string;
}

export default function GlowingText({
  text,
  duration = 2.5,
  color = '#2563eb',
  className = '',
}: GlowingTextProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Canvas-based ghost outline → fill animation
  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    let startTime: number | null = null;
    let animationId: number;

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Draw ghost outline (full text)
      ctx.font = getComputedStyle(container).font;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, h / 2);

      // Draw filled text with clip (left to right)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w * progress, h);
      ctx.clip();

      // Glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = color;
      ctx.fillText(text, 0, h / 2);

      // Second pass for stronger glow
      ctx.shadowBlur = 40;
      ctx.fillText(text, 0, h / 2);

      ctx.restore();

      if (progress < 1) {
        animationId = requestAnimationFrame(render);
      } else {
        // Final glow pulse
        const pulse = (t: number) => {
          const pulseProgress = ((Math.sin((t - timestamp) / 300) + 1) / 2) * 0.3 + 0.7;
          ctx.clearRect(0, 0, w, h);

          ctx.font = getComputedStyle(container).font;
          ctx.shadowColor = color;
          ctx.shadowBlur = 20 + (10 * pulseProgress);
          ctx.fillStyle = color;
          ctx.textBaseline = 'middle';
          ctx.fillText(text, 0, h / 2);

          requestAnimationFrame(pulse);
        };
        requestAnimationFrame(pulse);
      }
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [text, duration, color, reducedMotion]);

  if (reducedMotion) {
    // Skip animation, show filled text immediately
    return (
      <span
        ref={containerRef}
        className={className}
        aria-label={text}
        style={{ color }}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      ref={containerRef}
      className={className}
      aria-label={text}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
      <span style={{ visibility: 'hidden' }}>{text}</span>
    </span>
  );
}
