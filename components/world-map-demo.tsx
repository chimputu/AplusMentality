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
            end: { lat: 51.5074, lng: -0.1278 }, // London
          },
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: 40.7128, lng: -74.0060 }, // New York
          },
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: 25.2048, lng: 55.2708 }, // Dubai
          },
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: -26.2041, lng: 28.0473 }, // Johannesburg
          },
          {
            start: { lat: -15.3875, lng: 28.3228 }, // Lusaka, Zambia
            end: { lat: 39.9042, lng: 116.4074 }, // Beijing
          },
        ]}
      />
    </div>
  );
}
