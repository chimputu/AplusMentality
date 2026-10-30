"use client";
import WorldMap from "@/components/ui/world-map";
import { motion } from "motion/react";

export default function WorldMapDemo() {
  return (
    <div className="py-16 sm:py-20 bg-background w-full">
      <div className="max-w-7xl mx-auto text-center px-4">
        <p className="font-bold text-xl md:text-4xl text-foreground">
          Connecting Zambia{" "}
          <span className="text-primary">
            {"Globally".split("").map((word, idx) => (
              <motion.span
                key={idx}
                className="inline-block"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.04 }}
              >
                {word}
              </motion.span>
            ))}
          </span>
        </p>
        <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto py-4">
          A+ Mentality bridges the gap between local brilliance and global
          opportunity. Empowering Zambian students to reach out to the world.
        </p>
      </div>
      <WorldMap
        dots={[
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: 51.5074, lng: -0.1278 }, // London (Europe)
          },
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: 40.7128, lng: -74.0060 }, // New York (North America)
          },
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: 39.9042, lng: 116.4074 }, // Beijing (Asia)
          },
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: -23.5505, lng: -46.6333 }, // São Paulo (South America)
          },
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: -33.8688, lng: 151.2093 }, // Sydney (Oceania)
          },
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: -77.8419, lng: 166.6863 }, // Antarctica
          },
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: 30.0444, lng: 31.2357 }, // Cairo (Africa)
          },
        ]}
      />
    </div>
  );
}
