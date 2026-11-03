'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import * as Sentry from '@sentry/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Mail, Phone, MapPin, Send,
  Share2, Globe, AtSign, Link as LinkIcon,
  Users, BookOpen, Award, Heart,
  GraduationCap, Target, Users as UsersIcon, CheckCircle,
  FileText, Book, ClipboardList, MessageCircle, Briefcase, Crown,
  Compass, TrendingUp, PlayCircle, Megaphone, UserPlus,
  Download,
} from 'lucide-react';
import { CourseCard } from '@/components/course-card';
import { InstitutionLogo } from '@/components/institution-logo';
import ThemeToggle from '@/components/ThemeToggle';

// Dynamically import heavy components to reduce initial bundle and TBT
const BannerCarouselLazy = dynamic(
  () => import('@/components/banner-carousel'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
    ),
  },
);

const HomeAIAssistantWrapperLazy = dynamic(
  () => import('@/components/ai/home-ai-assistant-wrapper').then(mod => ({ default: mod.HomeAIAssistantWrapper })),
  {
    ssr: false,
    loading: () => null, // AI assistant is non-critical, no skeleton needed
  },
);

// Lazy load heavy below-the-fold components for faster initial page load
const WorldMapDemoLazy = dynamic(() => import('@/components/world-map-demo'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-muted rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground">Loading map...</span>
    </div>
  ),
});

const AnimatedTestimonialsDemoLazy = dynamic(() => import('@/components/animated-testimonials-demo'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-muted rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground">Loading testimonials...</span>
    </div>
  ),
});

const fadeInUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

// Mobile-safe animation: always visible, just fades in
const mobileSafe: any = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

const partnerInstitutions = [
  { name: 'University of Zambia', shortName: 'UNZA', logoUrl: '/universities/University_of_Zambia.png' },
  { name: 'Copperbelt University', shortName: 'CBU', logoUrl: '/universities/Copperbelt_university.jpeg' },
  { name: 'Mulungushi University', shortName: 'MU', logoUrl: '/universities/mulungushi_university.jpeg' },
  { name: 'Kwame Nkrumah University', shortName: 'NKU', logoUrl: '/universities/Kwame_Nkhruma_University.jpeg' },
  { name: 'Chalimbana University', shortName: 'CU', logoUrl: '/universities/Chalimbana_University.jpeg' },
  { name: 'Cavendish University Zambia', shortName: 'CUZ', logoUrl: '/universities/Cavendish_University.png' },
  { name: 'Mukuba University', shortName: 'MUK', logoUrl: '/universities/Mukuba_University.png' },
];

const featureCards = [
  { title: 'Expert Tutors', description: 'Learn from qualified professionals.', image: '/photos/expertTutors.png' },
  { title: 'Lecture Slides', description: 'Comprehensive slide decks for each course.', image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=400&fit=crop' },
  { title: 'Past Exam Papers', description: 'Practice with past papers from Zambia.', image: '/photos/exampapers.png' },
  { title: 'E-Books & Notes', description: 'Curated e-books and study notes.', image: '/photos/e-book&notes.png' },
  { title: 'Video Lessons', description: 'Engaging tutorials on every topic.', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop' },
  { title: 'Interactive Quizzes', description: 'Test your knowledge with instant feedback.', image: '/photos/quizzes.png' },
  { title: 'Mentorship & Support', description: 'One-on-one guidance from mentors.', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop' },
  { title: 'Career Guidance', description: 'Prepare for your future with career resources.', image: '/photos/careerGuidance.png' },
];

function UniversitiesCarousel() {
  // Duplicate the array for seamless infinite loop
  const doubled = [...partnerInstitutions, ...partnerInstitutions];

  return (
    <div className="relative overflow-hidden">
      {/* Fade masks on the edges for a smooth blend */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Infinite marquee track */}
      <div className="flex gap-4 animate-marquee">
        {doubled.map((inst, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-[200px] sm:w-[240px]"
          >
            <div className="bg-white rounded-xl border border-border p-4 text-center hover:shadow-lg hover:border-blue-300 transition-all duration-300 h-full flex flex-col items-center justify-center shadow-sm">
              <InstitutionLogo
                name={inst.name}
                shortName={inst.shortName}
                logoUrl={inst.logoUrl}
                size="md"
              />
              <p className="mt-3 text-sm font-semibold text-foreground leading-tight">
                {inst.name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Zambian Institution
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureCardsMarquee() {
  // Duplicate the array for seamless infinite loop
  const doubled = [...featureCards, ...featureCards];

  return (
    <div className="relative overflow-hidden">
      {/* Fade masks on the edges for a smooth blend */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-blue-50 dark:from-muted to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-blue-50 dark:from-muted to-transparent z-10 pointer-events-none" />

      {/* Infinite marquee track */}
      <div className="flex gap-6 animate-feature-marquee">
        {doubled.map((item, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-[280px] sm:w-[320px]"
          >
            <div className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-48 sm:h-56 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-400">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 280px, 320px"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              <div className="relative h-full flex flex-col justify-end p-5">
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-gray-100 mt-1">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// GradingCycle — 4-second cycling between Degree Classification and Grade Bands
// ============================================================
function GradingCycle() {
  const [activeView, setActiveView] = useState<'degree' | 'gradeBands'>('degree');

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveView((prev) => (prev === 'degree' ? 'gradeBands' : 'degree'));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setActiveView('degree')}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            activeView === 'degree' ? 'w-8 bg-blue-600' : 'w-2.5 bg-muted-foreground/40 hover:bg-muted-foreground/60'
          }`}
          aria-label="Show Degree Classification"
          title="Degree Classification"
        />
        <button
          onClick={() => setActiveView('gradeBands')}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            activeView === 'gradeBands' ? 'w-8 bg-blue-600' : 'w-2.5 bg-muted-foreground/40 hover:bg-muted-foreground/60'
          }`}
          aria-label="Show Grade Bands"
          title="Grade Bands"
        />
      </div>

      {/* Cycling content container with fixed min-height */}
      <div className="relative min-h-[320px] sm:min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeView === 'degree' ? (
            <motion.div
              key="degree"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-base sm:text-xl font-bold text-foreground text-center mb-1 sm:mb-2">
                Degree Classification
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mb-3 sm:mb-6 max-w-2xl mx-auto">
                Based on cumulative points from 20 courses at 3rd &amp; 4th Year Levels (4-Year programmes)
                or 4th &amp; 5th Year Levels (5-Year programmes)
              </p>

              {/* Degree classification cards — responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {/* Distinction */}
                <div className="relative rounded-xl border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm sm:text-lg">★</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] sm:text-xs font-bold">
                          Distinction
                        </span>
                      </div>
                      <p className="text-sm sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 sm:mt-1">
                        40 Points and above
                      </p>
                    </div>
                  </div>
                </div>

                {/* Merit */}
                <div className="relative rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm sm:text-lg">◆</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] sm:text-xs font-bold">
                          Merit
                        </span>
                      </div>
                      <p className="text-sm sm:text-xl font-bold text-blue-700 dark:text-blue-400 mt-0.5 sm:mt-1">
                        30-39.9 Points
                      </p>
                    </div>
                  </div>
                </div>

                {/* Credit */}
                <div className="relative rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-amber-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm sm:text-lg">●</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] sm:text-xs font-bold">
                          Credit
                        </span>
                      </div>
                      <p className="text-sm sm:text-xl font-bold text-amber-700 dark:text-amber-400 mt-0.5 sm:mt-1">
                        20-29.9 Points
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pass */}
                <div className="relative rounded-xl border-2 border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-rose-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm sm:text-lg">○</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] sm:text-xs font-bold">
                          Pass
                        </span>
                      </div>
                      <p className="text-sm sm:text-xl font-bold text-rose-700 dark:text-rose-400 mt-0.5 sm:mt-1">
                        Less than 20 Points
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="gradeBands"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-base sm:text-xl font-bold text-foreground text-center mb-1 sm:mb-2">
                Grade Bands
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mb-2 sm:mb-6">
                Each grade band shows the letter grade, percentage range, and points awarded.
              </p>

              {/* Color legend */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 mb-2 sm:mb-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Distinction</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                  <span>Merit / Credit</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-500" />
                  <span>Pass</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-rose-500" />
                  <span>Fail</span>
                </span>
              </div>

              {/* Grade badges grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                {/* A+ */}
                <div className="group rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-white dark:bg-neutral-900 p-2 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-emerald-500 text-white text-sm sm:text-lg font-bold">
                      A+
                    </span>
                    <div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs font-semibold">
                        Upper Distinction
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-semibold text-foreground">86 and above</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">2.5</span>
                    </div>
                  </div>
                </div>

                {/* A */}
                <div className="group rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-white dark:bg-neutral-900 p-2 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-emerald-500 text-white text-sm sm:text-lg font-bold">
                      A
                    </span>
                    <div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs font-semibold">
                        Distinction
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-semibold text-foreground">76-85</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">2.0</span>
                    </div>
                  </div>
                </div>

                {/* B+ */}
                <div className="group rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-neutral-900 p-2 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-blue-500 text-white text-sm sm:text-lg font-bold">
                      B+
                    </span>
                    <div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs font-semibold">
                        Merit
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-semibold text-foreground">66-75</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">1.5</span>
                    </div>
                  </div>
                </div>

                {/* B */}
                <div className="group rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-neutral-900 p-2 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-blue-500 text-white text-sm sm:text-lg font-bold">
                      B
                    </span>
                    <div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs font-semibold">
                        Credit
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-semibold text-foreground">60-65</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">1.0</span>
                    </div>
                  </div>
                </div>

                {/* C+ */}
                <div className="group rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-white dark:bg-neutral-900 p-2 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-amber-500 text-white text-sm sm:text-lg font-bold">
                      C+
                    </span>
                    <div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-[10px] sm:text-xs font-semibold">
                        Clear Pass
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-semibold text-foreground">55-59</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">0.5</span>
                    </div>
                  </div>
                </div>

                {/* C */}
                <div className="group rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-white dark:bg-neutral-900 p-2 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-amber-500 text-white text-sm sm:text-lg font-bold">
                      C
                    </span>
                    <div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-[10px] sm:text-xs font-semibold">
                        Bare Pass
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-semibold text-foreground">50-54</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">0.25</span>
                    </div>
                  </div>
                </div>

                {/* D+ */}
                <div className="group rounded-xl border-2 border-rose-200 dark:border-rose-800 bg-white dark:bg-neutral-900 p-2 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-rose-500 text-white text-sm sm:text-lg font-bold">
                      D+
                    </span>
                    <div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 text-[10px] sm:text-xs font-semibold">
                        Bare Fail
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-semibold text-foreground">45-49</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">0</span>
                    </div>
                  </div>
                </div>

                {/* D */}
                <div className="group rounded-xl border-2 border-rose-200 dark:border-rose-800 bg-white dark:bg-neutral-900 p-2 sm:p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-rose-500 text-white text-sm sm:text-lg font-bold">
                      D
                    </span>
                    <div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 text-[10px] sm:text-xs font-semibold">
                        Fail
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Percentage</span>
                      <span className="font-semibold text-foreground">44 and below</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function HomePageClient() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  // Sentry: Set user context so errors are associated with the logged-in user
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        username: user.username ?? undefined,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  // Fetch user's institutionId for homepage banners
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!isSignedIn) {
      setInstitutionId(undefined);
      return;
    }
    let cancelled = false;
    fetch('/api/users/me')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data?.user?.institutionId) return;
        setInstitutionId(data.user.institutionId);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSignedIn]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

  // ============================================================
  // ZAMBIA 2026 DATA — Based on HEA Gazette & University Websites
  // ============================================================


  const exploreItems = [
    { icon: <TrendingUp className="w-6 h-6" />, title: 'Trending Now', description: 'Discover what\'s popular among Zambian learners.', color: 'hover:bg-primary-light hover:border-blue-300' },
    { icon: <PlayCircle className="w-6 h-6" />, title: 'Watch Videos', description: 'Access educational videos aligned with the Zambian curriculum.', color: 'hover:bg-primary-light hover:border-blue-300' },
    { icon: <Compass className="w-6 h-6" />, title: 'Course Pathways', description: 'Explore Natural Sciences and Computer Science.', color: 'hover:bg-emerald-50 hover:border-emerald-300' },
    { icon: <Megaphone className="w-6 h-6" />, title: 'Advertise with Us', description: 'Reach students across Zambia.', color: 'hover:bg-primary-light hover:border-blue-300' },
    { icon: <Briefcase className="w-6 h-6" />, title: 'Career Guidance', description: 'Get expert advice on Zambian career opportunities.', color: 'hover:bg-emerald-50 hover:border-emerald-300' },
  ];

  // ============================================================
  // NEWSLETTER SUBSCRIPTION HANDLER (Brevo via API route)
  // ============================================================
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubscribed(true);
        setEmail('');
        setTimeout(() => setIsSubscribed(false), 5000);
      } else {
        alert(data.error || 'Something went wrong. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      alert('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = (courseCode: string) => {
    if (!isSignedIn) {
      router.push(`/sign-up?redirect=/student?enrolled=${courseCode}`);
    } else {
      router.push(`/student?enrolled=${courseCode}`);
    }
  };

  const handleExplore = () => {
    if (!isSignedIn) {
      router.push('/sign-up');
    } else {
      router.push('/student');
    }
  };

  const handleViewAllCourses = () => {
    if (!isSignedIn) {
      router.push('/sign-up');
    } else {
      router.push('/courses');
    }
  };

  // ---- Combined Course Data ----
  const year1Courses = [
    // Semester 1
    { code: 'CHE111', title: 'Introductory Chemistry', description: 'Atomic structure, bonding, and stoichiometry.', image: '/photos/chem111.png' },
    { code: 'BIO111', title: 'Bio-molecules and Cells', description: 'Cell biology, genetics, and molecular foundations.', image: '/photos/bio111.png' },
    { code: 'PHY101', title: 'Fundamentals of Physics', description: 'Mechanics, thermodynamics, and waves.', image: '/photos/phy101.png' },
    { code: 'MSM111', title: 'Mathematical Methods I', description: 'Limits, derivatives, and integrals.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop' },
    // Semester 2
    { code: 'BIO112', title: 'Molecular Biology and Genetics', description: 'DNA replication, transcription, and inheritance.', image: '/photos/bio111.png' },
    { code: 'PHY102', title: 'Introductory Physics II', description: 'Electromagnetism, optics, and modern physics.', image: '/photos/phy101.png' },
    { code: 'MSM112', title: 'Mathematical Methods II', description: 'Differential equations, vectors, and matrices.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop' },
    { code: 'CHE112', title: 'Introductory Chemistry II', description: 'Organic chemistry, acids, and bases.', image: '/photos/chem111.png' },
  ];

  const year2Courses = [
    // Semester 1
    { code: 'ICT402', title: 'Statistics and Empirical Methods for Computing', description: 'Statistical analysis, regression, and data interpretation.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop' },
    { code: 'ICT261', title: 'Intro to OOP and JAVA', description: 'Object-oriented programming principles with Java.', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop' },
    { code: 'ICT221', title: 'Computer Architecture', description: 'CPU design, memory hierarchy, and instruction sets.', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=200&fit=crop' },
    { code: 'ICT241', title: 'Digital Design', description: 'Logic gates, flip-flops, and combinational circuits.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop' },
    { code: 'ICT201', title: 'Discrete Mathematics', description: 'Logic, sets, relations, and graph theory.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop' },
    // Semester 2
    { code: 'ICT222', title: 'Operating Systems', description: 'Process management, memory, and file systems.', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=200&fit=crop' },
    { code: 'ICT242', title: 'Networking and Communication', description: 'OSI model, TCP/IP, and network security.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop' },
    { code: 'ICT202', title: 'Data Structures and Algorithms', description: 'Stacks, queues, trees, and sorting algorithms.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop' },
    { code: 'ICT262', title: 'Intermediate Java Programming', description: 'Advanced OOP, collections, and multithreading.', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop' },
    { code: 'ICT271', title: 'Databases', description: 'SQL, database design, and transaction management.', image: '/photos/databases.png' },
  ];

  return (
    <div className="min-h-screen bg-muted overflow-x-hidden">
      {/* ===== BANNERS — MUST BE FIRST so they appear above the navbar ===== */}
      <BannerCarouselLazy placement="HOMEPAGE" institutionId={institutionId} />

      {/* ===== NAVBAR — sticky (sticks when scrolled to, sits below banner) ===== */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="w-full px-2 sm:px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A+</span>
              </div>
              <span className="text-xl font-bold text-foreground">Mentality</span>
            </Link>

            <div className="hidden md:flex items-center space-x-2">
              <Link href="/sign-in" className="text-sm font-medium text-foreground hover:text-blue-600 transition focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Get Started
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center gap-1.5 border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Download className="w-4 h-4" />
                Download App
              </Link>
              <ThemeToggle />
              <span className="w-px h-5 border-border mx-1"></span>
              <Link href="https://smartcorp.example.com">
                <div className="bg-muted text-foreground text-[10px] font-medium px-2.5 py-1 rounded-full border border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(147,51,234,0.3)] animate-pulse">
                  Owned by SmartCorp
                </div>
              </Link>
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-muted transition" aria-label="Toggle menu">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-card border-b border-border px-2 py-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <Link href="/sign-in" className="block text-sm font-medium text-foreground hover:text-blue-600 transition focus-visible:ring-2 focus-visible:ring-blue-500 rounded" onClick={() => setIsMenuOpen(false)}>
              Sign In
            </Link>
            <Link href="/sign-up" className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition text-center focus-visible:ring-2 focus-visible:ring-blue-500" onClick={() => setIsMenuOpen(false)}>
              Get Started
            </Link>
            <Link href="/download" className="flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition focus-visible:ring-2 focus-visible:ring-blue-500 rounded" onClick={() => setIsMenuOpen(false)}>
              <Download className="w-4 h-4" />
              Download App
            </Link>
            <Link href="https://smartcorp.example.com">
            <div className="text-xs text-muted-foreground text-center">Owned by SmartCorp</div>
            </Link>
          </div>
        )}
      </nav>

      {/* ===== HERO – BACKGROUND IMAGE ===== */}
      <section className="relative min-h-[85vh] md:min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <Image
          src="/mmst-grad-group.png"
          alt=""
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-center"
          aria-hidden="true"
        />

        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* LEFT: Headline + CTAs */}
            <div className="text-center lg:text-left space-y-6">
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                <span className="block">Your Goal.</span>
                <span className="block text-blue-500 mt-2">
                  Our tools.
                </span>
                <span className="block mt-2">
                  Your{' '}
                  <span className="text-blue-500">A+</span>{' '}
                  result.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-gray-200 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                A+ Mentality helps students study smarter, stay organized, and track progress so you can achieve more and stress less.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link
                  href="/sign-up"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </Link>
                <Link
                  href="#explore"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium transition-colors border border-white/40"
                >
                  Explore Features
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 justify-center lg:justify-start text-sm text-gray-300 pt-4">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-gray-200" />
                  Free to start
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-gray-200" />
                  Learn offline
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-gray-200" />
                  Mentors available
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-gray-200" />
                  Built for Zambians
                </span>
              </div>
            </div>

            {/* RIGHT: Blur Box Card (No Video) */}
            <div className="flex justify-center lg:justify-end w-full">
              <div className="relative w-full max-w-md">
                
                {/* Subtle glow behind card */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-3xl blur-3xl" />
                
                {/* The Blur Box Card */}
                <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Built for Zambian Students
                  </h3>
                  <p className="text-gray-200 text-sm mb-6">
                    By Zambians, for Zambians
                  </p>
                  <div className="flex justify-center gap-6 text-sm mb-8">
                    <div>
                      <p className="font-bold text-white text-lg">Quality</p>
                      <p className="text-gray-300 text-xs">Content</p>
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">Expert</p>
                      <p className="text-gray-300 text-xs">Mentors</p>
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">Learn</p>
                      <p className="text-gray-300 text-xs">Offline</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/20">
                    <p className="text-xs text-gray-300">
                      Join the A+ Mentality community today
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== FOUR PILLARS ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={staggerContainer}
        className="py-10 sm:py-12 bg-card border-b border-border"
      >
        <div className="w-full px-3 sm:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-foreground text-sm">Study Smarter</h3>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-bold text-foreground text-sm">Track Progress</h3>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-bold text-foreground text-sm">Reach Your Goals</h3>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Crown className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-foreground text-sm">Build an A+ Mindset</h3>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ===== TOP ZAMBIAN UNIVERSITIES – FULL-WIDTH LOGO CARDS ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={staggerContainer}
        className="py-10 sm:py-12 bg-background"
      >
        <div className="w-full px-3 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Top Zambian Universities</h2>
            <p className="mt-2 text-muted-foreground">
              The leading public universities in Zambia
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {[
              { name: 'University of Zambia', location: 'Lusaka', logo: '/unza.png' },
              { name: 'Copperbelt University', location: 'Kitwe', logo: '/cbu.png' },
              { name: 'Mulungushi University', location: 'Kabwe', logo: '/mulu.png' },
              { name: 'Kwame Nkrumah University', location: 'Kabwe', logo: '/nku.png' },
              { name: 'Chalimbana University', location: 'Lusaka', logo: '/chau.png' },
            ].map((uni, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 hover:scale-[1.04] transition-all duration-300 flex flex-col shadow-sm"
              >
                <div className="w-full h-28 sm:h-36 md:h-44 bg-muted flex items-center justify-center overflow-hidden">
                  <Image
                    src={uni.logo}
                    alt={uni.name}
                    width={180}
                    height={120}
                    className="object-contain w-full h-full p-2"
                  />
                </div>
                <div className="p-3 sm:p-4 text-center border-t border-border">
                  <h3 className="font-bold text-foreground text-xs sm:text-sm md:text-base group-hover:text-blue-600 transition-colors">
                    {uni.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{uni.location}</p>
                </div>
              </motion.div>
            ))}
          </div>

         
        </div>
      </motion.section>

      {/* ===== WORLD MAP — CONNECTING ZAMBIA GLOBALLY ===== */}
      <WorldMapDemoLazy />

      {/* ===== MUST EXPLORE ===== */}
      <motion.section
        id="explore"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={staggerContainer}
        className="py-16 bg-muted"
      >
        <div className="w-full px-3 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Compass className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Must Explore</h2>
            <p className="mt-2 text-muted-foreground">Discover the best of what A+ Mentality has to offer</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {exploreItems.map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className={`bg-card rounded-xl p-6 text-center shadow-sm border-2 border-border transition-all duration-300 cursor-pointer ${item.color} hover:scale-[1.02] hover:shadow-lg`}
                onClick={handleExplore}
              >
                <div className="flex justify-center mb-3 text-foreground">{item.icon}</div>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                <div className="mt-3 text-blue-600 font-medium text-sm">Explore →</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== WHAT WE OFFER ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={staggerContainer}
        className="w-full py-12 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-muted dark:to-background"
      >
        <div className="w-full px-3 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Crown className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">What We Offer</h2>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed in your academic journey. All in one place.
            </p>
          </motion.div>

          <FeatureCardsMarquee />
        </div>
      </motion.section>

      {/* ===== OUR AIM ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-10 sm:py-12 bg-background"
      >
        <div className="w-full px-3 sm:px-4">
          <div className="text-center mb-10">
            <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Our Aim</h2>
            <p className="mt-2 text-muted-foreground max-w-3xl mx-auto">
              At <span className="font-semibold text-blue-600">A+ Mentality</span>, we believe that every Zambian student
              deserves access to high-quality education and mentorship. Our mission is to bridge the gap between
              traditional learning and modern technology by providing:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-muted rounded-xl p-6 text-center hover:shadow-lg transition border border-border">
              <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Curriculum-Aligned Content</h3>
              <p className="text-muted-foreground text-sm mt-2">Handpicked videos, courses, and resources tailored to the Zambian curriculum and HEA standards.</p>
            </div>
            <div className="bg-muted rounded-xl p-6 text-center hover:shadow-lg transition border border-border">
              <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Expert Mentorship</h3>
              <p className="text-muted-foreground text-sm mt-2">Learn from experienced professionals, industry leaders, and academic scholars who guide you every step of the way.</p>
            </div>
            <div className="bg-muted rounded-xl p-6 text-center hover:shadow-lg transition border border-border">
              <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Community Support</h3>
              <p className="text-muted-foreground text-sm mt-2">Join a vibrant community of Zambian learners, share ideas, collaborate, and grow together.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ============================================================== */}
      {/* ===== COURSES BY YEAR ===== */}
      {/* ============================================================== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={staggerContainer}
        className="py-10 sm:py-12 bg-muted"
      >
        <div className="w-full px-3 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Your Course Journey</h2>
            <p className="mt-2 text-muted-foreground max-w-3xl mx-auto">
              From Natural Sciences to Computer Science. A complete academic pathway
               aligned with Zambian university standards.
            </p>
          </motion.div>

          {/* ===== YEAR 1 – Natural Sciences ===== */}
          <motion.div variants={fadeInUp} className="mb-12">
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div>
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Year 1 - Semester 1
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">Natural Sciences Foundation</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {year1Courses.slice(0,4).map((course, idx) => (
                <CourseCard
                  key={idx}
                  code={course.code}
                  title={course.title}
                  description={course.description}
                  image={course.image}
                  category="Natural Sciences"
                  variant="blue"
                  onEnroll={() => handleEnroll(course.code)}
                />
              ))}
            </div>
          </motion.div>

          {/* ===== YEAR 1 - Semester 2 ===== */}
          <motion.div variants={fadeInUp} className="mb-12">
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div>
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Year 1 - Semester 2
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">Natural Sciences Advanced</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {year1Courses.slice(4).map((course, idx) => (
                <CourseCard
                  key={idx}
                  code={course.code}
                  title={course.title}
                  description={course.description}
                  image={course.image}
                  category="Natural Sciences"
                  variant="blue"
                  onEnroll={() => handleEnroll(course.code)}
                />
              ))}
            </div>
          </motion.div>

          {/* ===== YEAR 2 - Semester 1 ===== */}
          <motion.div variants={fadeInUp} className="mb-12">
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div>
                <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Year 2 - Semester 1
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">Computer Science Foundation</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {year2Courses.slice(0,5).map((course, idx) => (
                <CourseCard
                  key={idx}
                  code={course.code}
                  title={course.title}
                  description={course.description}
                  image={course.image}
                  category="Computer Science"
                  variant="emerald"
                  onEnroll={() => handleEnroll(course.code)}
                />
              ))}
            </div>
          </motion.div>

          {/* ===== YEAR 2 - Semester 2 ===== */}
          <motion.div variants={fadeInUp}>
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div>
                <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Year 2 - Semester 2
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">Computer Science Advanced</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {year2Courses.slice(5).map((course, idx) => (
                <CourseCard
                  key={idx}
                  code={course.code}
                  title={course.title}
                  description={course.description}
                  image={course.image}
                  category="Computer Science"
                  variant="emerald"
                  onEnroll={() => handleEnroll(course.code)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ===== ZAMBIAN GRADING & DEGREE CLASSIFICATION SYSTEM ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-10 sm:py-16 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-muted dark:to-background"
        aria-labelledby="grading-section-heading"
      >
        <div className="w-full px-3 sm:px-4">
          {/* Section heading */}
          <div className="text-center mb-8 sm:mb-12">
            <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 id="grading-section-heading" className="text-2xl sm:text-3xl font-bold text-foreground">
              Zambian University Grading System
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
              Understanding how Zambian universities grade academic performance
            </p>
          </div>

          {/* ===== CYCLING: Degree Classification ↔ Grade Bands ===== */}
          <GradingCycle />

        </div>
      </motion.section>

      {/* ===== SIGN UP AS A TUTOR ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-10 sm:py-12 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-muted dark:to-background"
      >
        <div className="w-full px-3 sm:px-4">
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6 sm:p-8 md:p-12 text-center max-w-4xl mx-auto">
            <UserPlus className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Become a Tutor</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Share your knowledge and expertise with Zambian students.
              Join our community of professional tutors and make a difference.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 bg-muted rounded-full px-6 py-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-foreground">+260 954 953 610</span>
              </div>
              <a
                href="https://wa.me/260772231300"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-foreground rounded-full px-6 py-3 transition shadow-md"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-medium">WhatsApp</span>
              </a>
              <Link
                href="mailto:kafiswegchimputu@gmail.com"
                className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition shadow-md inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Mail className="w-5 h-5" /> Email Us
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== ADVERTISE WITH US ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-10 sm:py-12 bg-primary-light"
      >
        <div className="w-full px-3 sm:px-4 flex flex-col md:flex-row items-center justify-between bg-card rounded-2xl shadow-md border border-border p-6 sm:p-8 md:p-12 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Interested in advertising with us?</h2>
            <p className="text-muted-foreground mt-1">Reach Zambian students and educators.</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowContactMenu(!showContactMenu)}
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition shadow-md inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Get in touch <span className="text-lg">→</span>
            </button>
            {showContactMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50">
                <a
                  href="mailto:kafiswegchimputu@gmail.com?subject=Advertising%20Inquiry%20-%20A%2B%20Mentality"
                  className="block px-4 py-3 text-sm text-foreground hover:bg-primary-light hover:text-blue-600 transition border-b border-border"
                >
                  ✉️ Email Us
                </a>
                <a
                  href="https://wa.me/260772231300?text=Hi%2C%20I%27m%20interested%20in%20advertising%20with%20A%2B%20Mentality"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm text-foreground hover:bg-green-50 hover:text-green-600 transition"
                >
                  💬 WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ===== WHY CHOOSE A+ MENTALITY ===== */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* LEFT SIDE: Why Choose A+ Mentality */}
            <div className="space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Why Choose <span className="text-blue-600">A+ Mentality</span>?
              </h2>
              
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <strong className="text-foreground">Curriculum-Aligned Content.</strong>
                    <p className="text-muted-foreground text-sm mt-1">All materials follow the Zambian syllabus and HEA standards.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <strong className="text-foreground">Expert Mentors.</strong>
                    <p className="text-muted-foreground text-sm mt-1">Learn from qualified professionals who guide you every step.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <strong className="text-foreground">Community Support.</strong>
                    <p className="text-muted-foreground text-sm mt-1">Join a community of like-minded Zambian learners.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <strong className="text-foreground">Progress Tracking.</strong>
                    <p className="text-muted-foreground text-sm mt-1">See your growth in real time and stay motivated.</p>
                  </div>
                </li>
              </ul>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/sign-up" className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500">
                  Join Now
                </Link>
                <a href="https://wa.me/260772231300" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-foreground px-6 py-3 rounded-full font-medium hover:bg-green-600 transition-colors flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* RIGHT SIDE: YouTube Video */}
            <div className="relative w-full max-w-xl mx-auto lg:mx-0">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/g6BtbIiJ_rc?start=6&rel=0&modestbranding=1"
                  title="A+ Student Mentality - Best Study Motivation"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== WORD OF ENCOURAGEMENT ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-10 sm:py-12 bg-blue-600 text-white"
      >
        <div className="w-full px-3 sm:px-4 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-blue-200" />
          <h2 className="text-2xl sm:text-3xl font-bold">You Are Capable of Great Things</h2>
          <p className="mt-4 text-base sm:text-lg text-blue-100">
            Every expert was once a beginner. Keep learning, keep growing, and never give up.
            Your future is bright, and we're here to help you shine.
          </p>
          <div className="mt-8">
            <a
              href="https://chat.whatsapp.com/Jjlf7KhcJpDLwDBW7ylURp?s=cl&p=a&mlu=4&ilr=4"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-card text-blue-600 px-6 sm:px-8 py-3 rounded-full font-medium hover:bg-primary-light transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Join Our Community
            </a>
          </div>
        </div>
      </motion.section>

      {/* ===== PARTNER INSTITUTIONS — HORIZONTAL CAROUSEL ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-10 sm:py-12 bg-muted"
      >
        <div className="w-full px-3 sm:px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Aligned with Zambia's University Curriculum
            </h2>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
              Supporting students across Zambia's leading academic institutions
            </p>
          </div>

          <UniversitiesCarousel />

          <div className="text-center mt-8">
            <Link
              href="/universities"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              View All Universities
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-neutral-950 text-white">
        <div className="w-full px-3 sm:px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A+</span>
                </div>
                <span className="text-xl font-bold text-white">Mentality</span>
              </Link>
              <p className="mt-4 text-sm text-gray-400">
                Empowering Zambian lifelong learners through curated content, mentorship, and community support.
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-500 transition" aria-label="Share"><Share2 className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition" aria-label="Website"><Globe className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition" aria-label="Email"><AtSign className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition" aria-label="Link"><LinkIcon className="w-5 h-5" /></a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="https://smartcorp.example.com" className="text-gray-400 hover:text-white transition">About Us</Link></li>
                <li><Link href="https://smartcorp.example.com/contact" className="text-gray-400 hover:text-white transition">Contact</Link></li>
                <li><Link href="/download" className="text-gray-400 hover:text-white transition inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Download App</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <a href="mailto:kafiswegchimputu@gmail.com" className="text-gray-400 hover:text-white transition">
                    kafiswegchimputu@gmail.com
                  </a>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-400">+260 954 953 610</span>
                </li>
                <li className="flex items-center space-x-2">
                  <a
                    href="https://wa.me/260772231300"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-400 hover:text-green-300 transition"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    +260 772 231 300 
                  </a>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-400">Lusaka, Zambia</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Subscribe to Our Newsletter</h4>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div>
                  <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                  <input
                    id="newsletter-email"
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition flex items-center justify-center space-x-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      <span>Subscribe</span><Send className="w-4 h-4" />
                    </>
                  )}
                </button>
                {isSubscribed && <p className="text-green-400 text-sm text-center">✅ Subscribed successfully!</p>}
              </form>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} A+ Mentality Zambia. All rights reserved. Built for Zambian lifelong learners.
            <div className="mt-3 flex items-center justify-center gap-4">
              <Link href="/privacy-policy" className="text-xs text-gray-400 hover:text-white transition">
                Privacy Policy
              </Link>
              <span className="text-gray-500">•</span>
              <Link href="/terms-of-service" className="text-xs text-gray-400 hover:text-white transition">
                Terms of Service
              </Link>
              <span className="text-gray-500">•</span>
              <Link href="/api/health" className="text-xs text-gray-400 hover:text-white transition">
                System Status
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== KEYFRAMES ===== */}
      <style>{`
        @keyframes scrollRightToLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes testimonialScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes featureMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-feature-marquee {
          animation: featureMarquee 25s linear infinite;
        }
        .animate-feature-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ===== FLOATING WHATSAPP BUTTON ===== */}
      <a
        href="https://wa.me/260772231300"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-20 z-50 bg-green-500 hover:bg-green-600 text-foreground rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* ===== AI ASSISTANT (AWS-style floating widget) — dynamically loaded ===== */}
      <HomeAIAssistantWrapperLazy />
    </div>
  );
}