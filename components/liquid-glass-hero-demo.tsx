"use client";

import { motion, useReducedMotion } from "motion/react";
import { IconArrowRight, IconRocket } from "@tabler/icons-react";
import { LiquidGlass } from "@/components/ui/liquid-glass";

const LINKS = ["Product", "Pricing", "Changelog", "Docs"];

const GLASS_SHADOW =
  "shadow-[0_10px_40px_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.45)]";

export default function LiquidGlassHeroDemo() {
  const reduceMotion = useReducedMotion();
  const interaction = reduceMotion
    ? {}
    : { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } };

  return (
    <section className="relative isolate flex min-h-[44rem] w-full flex-col overflow-hidden px-4 text-white">
      <img
        src="https://assets.aceternity.com/screenshots/13.jpg"
        alt=""
        className="absolute inset-0 -z-10 size-full object-cover object-[center_40%]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

      <LiquidGlass
        tint={0.1}
        scale={32}
        bevelDepth={12}
        className={`mx-auto mt-4 w-full max-w-4xl ${GLASS_SHADOW}`}
        contentClassName="flex items-center justify-between py-2 pr-2 pl-5"
      >
        <a href="#" className="flex items-center gap-2 font-semibold">
          <IconRocket className="size-5" stroke={1.75} />
          Orbit
        </a>
        <nav className="hidden items-center gap-7 text-sm text-white/80 md:flex">
          {LINKS.map((link) => (
            <a key={link} href="#" className="hover:text-white">
              {link}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#"
            className="hidden px-3 text-sm text-white/80 hover:text-white sm:block"
          >
            Sign in
          </a>
          <motion.a
            {...interaction}
            href="#"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900"
          >
            Start free
          </motion.a>
        </div>
      </LiquidGlass>

      <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center py-20 text-center">
        <a href="#" className="rounded-full">
          <LiquidGlass
            tint={0.12}
            scale={24}
            bevelDepth={10}
            aberration={2}
            className={GLASS_SHADOW}
            contentClassName="flex items-center gap-2 py-1.5 pr-3 pl-1.5 text-sm"
          >
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-900">
              New
            </span>
            <span className="text-white/90">Launch week is live</span>
            <IconArrowRight className="size-3.5 text-white/70" />
          </LiquidGlass>
        </a>

        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance [text-shadow:0_2px_16px_rgb(0_0_0/0.25)] md:text-7xl">
          Ship your product into orbit.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-pretty text-white/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.3)]">
          Orbit plans, builds and launches your releases in one place, so your
          team spends less time on process and more time on the product.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <motion.button {...interaction} className="rounded-full">
            <LiquidGlass
              tint={0.2}
              className={GLASS_SHADOW}
              contentClassName="flex items-center gap-2 px-7 py-3.5 font-medium [text-shadow:0_1px_2px_rgb(0_0_0/0.25)]"
            >
              Book a demo
              <IconArrowRight className="size-4" />
            </LiquidGlass>
          </motion.button>
          <motion.button
            {...interaction}
            className="rounded-full bg-white px-7 py-3.5 font-medium text-neutral-900 shadow-lg"
          >
            Start for free
          </motion.button>
        </div>

        <p className="mt-8 text-sm text-white/70">
          Free for teams up to 5. No credit card needed.
        </p>
      </div>
    </section>
  );
}
