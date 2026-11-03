"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import {
  IconArrowRight,
  IconSchool,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import { LiquidGlass } from "@/components/ui/liquid-glass";

const NAV_LINKS = [
  { label: "Pricing", href: "/pricing" },
  { label: "Documentation", href: "/docs" },
  { label: "Universities", href: "/universities" },
];

const GLASS_SHADOW =
  "shadow-[0_10px_40px_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.45)]";

export default function LiquidGlassHeroDemo() {
  const reduceMotion = useReducedMotion();
  const interaction = reduceMotion
    ? {}
    : { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="relative isolate flex min-h-[44rem] w-full flex-col overflow-hidden px-4 text-white">
      {/* Background image — MMST graduation group photo */}
      <img
        src="/mmst-grad-group.png"
        alt=""
        className="absolute inset-0 -z-10 size-full object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* ---- Liquid Glass Navbar ---- */}
      <LiquidGlass
        tint={0.1}
        scale={32}
        bevelDepth={12}
        className={`mx-auto mt-4 w-full max-w-4xl ${GLASS_SHADOW}`}
        contentClassName="flex items-center justify-between py-2 pr-2 pl-5"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <IconSchool className="size-5" stroke={1.75} />
          A+ Mentality
        </Link>

        {/* Center links — hidden on mobile */}
        <nav className="hidden items-center gap-7 text-sm text-white/80 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right-side actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/download"
            className="hidden px-3 text-sm text-white/80 hover:text-white md:block"
          >
            Download
          </Link>
          <Link
            href="/sign-in"
            className="hidden px-3 text-sm text-white/80 hover:text-white sm:block"
          >
            Sign in
          </Link>
          <motion.a
            {...interaction}
            href="/sign-up"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900"
          >
            Get Started
          </motion.a>

          {/* Hamburger — visible on mobile only */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="ml-1 p-1 text-white/80 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <IconX className="size-5" />
            ) : (
              <IconMenu2 className="size-5" />
            )}
          </button>
        </div>
      </LiquidGlass>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-2 w-full max-w-4xl lg:hidden"
          >
            <LiquidGlass
              tint={0.15}
              scale={20}
              bevelDepth={8}
              className={GLASS_SHADOW}
              contentClassName="flex flex-col gap-1 p-4 text-sm text-white/80"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-1 border-t border-white/10" />
              <Link
                href="/download"
                className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Download
              </Link>
              <Link
                href="/sign-in"
                className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="mt-1 rounded-full bg-white px-4 py-2 text-center text-sm font-medium text-neutral-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </LiquidGlass>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Hero Content ---- */}
      <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center py-20 text-center">
        {/* Badge pill */}
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
              🇿🇲
            </span>
            <span className="text-white/90">Empowering Zambian Students</span>
            <IconArrowRight className="size-3.5 text-white/70" />
          </LiquidGlass>
        </a>

        {/* Main headline */}
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance [text-shadow:0_2px_16px_rgb(0_0_0/0.25)] md:text-6xl lg:text-7xl">
          Your Goal. Our Tools. Your A+ Result.
        </h1>

        {/* Subheadline */}
        <p className="mt-5 max-w-xl text-lg text-pretty text-white/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.3)]">
          Access curated past papers, connect with expert tutors, and elevate
          your academic journey across Zambian universities.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <motion.button {...interaction} className="rounded-full">
            <LiquidGlass
              tint={0.2}
              className={GLASS_SHADOW}
              contentClassName="flex items-center gap-2 px-7 py-3.5 font-medium [text-shadow:0_1px_2px_rgb(0_0_0/0.25)]"
            >
              Explore Features
              <IconArrowRight className="size-4" />
            </LiquidGlass>
          </motion.button>
          <motion.button
            {...interaction}
            className="rounded-full bg-white px-7 py-3.5 font-medium text-neutral-900 shadow-lg"
          >
            Join for Free
          </motion.button>
        </div>
      </div>
    </section>
  );
}
