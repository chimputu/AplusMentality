"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  IconBell,
  IconHeart,
  IconHome,
  IconSearch,
  IconUser,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { LiquidGlass } from "@/components/ui/liquid-glass";

const FEED = [
  { image: "components/hero-1.webp", title: "Hero sections", meta: "24 variants" },
  { image: "components/3d-globe.webp", title: "3D Globe", meta: "WebGL" },
  {
    image: "components/hero-section-with-mesh-gradient.webp",
    title: "Mesh gradients",
    meta: "Shaders",
  },
  { image: "components/keyboard-2.webp", title: "Keyboard", meta: "Interactive" },
  { image: "components/hero-2.webp", title: "Product heroes", meta: "12 variants" },
  { image: "components/hero-3.webp", title: "SaaS heroes", meta: "8 variants" },
];

const TABS = [
  { label: "Home", icon: IconHome },
  { label: "Search", icon: IconSearch },
  { label: "Alerts", icon: IconBell },
  { label: "Profile", icon: IconUser },
];

export default function LiquidGlassAppChromeDemo() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  return (
    <div className="flex w-full justify-center bg-neutral-100 py-10 dark:bg-neutral-900">
      <div className="relative h-[640px] w-[320px] overflow-hidden rounded-[48px] border-[6px] border-neutral-900 bg-white shadow-2xl dark:border-neutral-700">
        <div className="h-full overflow-y-auto px-3 pt-24 pb-28 [scrollbar-width:none]">
          <div className="flex flex-col gap-3">
            {FEED.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-3xl bg-neutral-100"
              >
                <img
                  src={`https://assets.aceternity.com/${item.image}`}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-500">{item.meta}</p>
                  </div>
                  <IconHeart className="size-5 text-neutral-400" />
                </div>
              </article>
            ))}
          </div>
        </div>

        <LiquidGlass
          radius={28}
          bevelDepth={12}
          scale={36}
          tint={0.35}
          className="absolute inset-x-3 top-3 shadow-[0_4px_20px_rgb(0_0_0/0.08),inset_0_1px_0_rgb(255_255_255/0.6)]"
          contentClassName="flex h-14 items-center justify-between px-5"
        >
          <span className="text-lg font-semibold tracking-tight text-neutral-900">
            Discover
          </span>
          <img
            src="https://assets.aceternity.com/avatars/manu.webp"
            alt=""
            className="size-8 rounded-full object-cover"
          />
        </LiquidGlass>

        <LiquidGlass
          bevelDepth={10}
          scale={28}
          aberration={2}
          tint={0.55}
          className="absolute inset-x-0 bottom-4 mx-auto w-fit shadow-[0_6px_20px_rgb(0_0_0/0.10),0_0_0_1px_rgb(0_0_0/0.04),inset_0_1px_0_rgb(255_255_255/0.8)]"
          contentClassName="flex p-1"
        >
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              aria-label={tab.label}
              aria-current={active === i ? "page" : undefined}
              className={cn(
                "relative flex h-11 w-14 flex-col items-center justify-center gap-0.5 rounded-full text-[9px] font-medium tracking-tight",
                active === i ? "text-neutral-900" : "text-neutral-500",
              )}
            >
              {active === i && (
                <motion.span
                  layoutId="liquid-glass-tab"
                  className="absolute inset-0 rounded-full bg-neutral-900/[0.06]"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", bounce: 0.2, duration: 0.4 }
                  }
                />
              )}
              <tab.icon className="relative size-[18px]" stroke={1.75} />
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </LiquidGlass>
      </div>
    </div>
  );
}
