'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, BookOpen, Video, Users, Zap, MapPin, Monitor, Smartphone } from 'lucide-react';

// Manual accordion item component
function AccordionItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-gray-900 dark:text-white pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
}

const modalities = [
  {
    name: 'Online Tutoring',
    icon: Monitor,
    description: 'Learn from anywhere via our integrated video platform. Connect with tutors nationwide without leaving your dorm or home.',
    pros: [
      'Nationwide access to any tutor',
      'Recorded sessions for review',
      'Flexible scheduling across time zones',
      'Screen sharing for live problem-solving',
    ],
  },
  {
    name: 'Physical Tutoring',
    icon: MapPin,
    description: 'Face-to-face sessions at your university campus or local library. Ideal for students who learn best in person.',
    pros: [
      'Zero distractions, focused environment',
      'Direct accountability and engagement',
      'Localized to your campus',
      'Whiteboard and hands-on problem solving',
    ],
  },
  {
    name: 'Hybrid Tutoring',
    icon: Users,
    description: 'The best of both worlds. Weekly physical check-ins combined with daily online support for maximum results.',
    pros: [
      'Maximum engagement and retention',
      'Perfect for exam preparation',
      'Regular in-person progress reviews',
      'Daily online chat support between sessions',
    ],
  },
];

const faqData = [
  {
    question: 'Are study materials really free?',
    answer: 'Yes — all PDFs, past exam papers, video lessons, lecture slides, and interactive quizzes are 100% free forever. You only pay when you book a 1-on-1 tutoring session.',
  },
  {
    question: 'How do I pay for a tutor?',
    answer: 'We accept Mobile Money (MTN, Airtel, Zamtel) and debit/credit card payments. After booking a session, you\'ll receive a payment link via email and SMS. Payment is processed securely before the session begins.',
  },
  {
    question: 'Can I request a specific tutor?',
    answer: 'Yes! You can browse tutors by their university, course expertise, and ratings. When booking, you can select a specific tutor or let us match you with the best available tutor for your course.',
  },
  {
    question: 'What if I need to cancel a session?',
    answer: 'You can cancel or reschedule a tutoring session up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may incur a small cancellation fee. Contact our support team for exceptions.',
  },
  {
    question: 'Do you offer group discounts?',
    answer: 'Yes! Studying with friends? Book a group session (2–4 students) and save up to 30% per person. Group sessions are available for both online and physical tutoring modalities.',
  },
];

export default function PricingClient() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* ===== HERO SECTION ===== */}
      <section className="px-4 py-16 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 mb-6">
            <BookOpen className="w-4 h-4" />
            Free Study Materials Included
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
            Invest in Your Academic Success
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Access thousands of past papers, videos, and notes for <span className="font-semibold text-gray-900 dark:text-white">free</span>. Upgrade to premium 1-on-1 tutoring to guarantee your A+.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-semibold transition shadow-md hover:shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/tutors"
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-white px-8 py-3 rounded-full font-semibold transition"
            >
              Browse Tutors
            </Link>
          </div>
        </div>
      </section>

      {/* ===== VARIABLE PRICING BANNER ===== */}
      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-500/5 dark:to-neutral-900 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Tutor Rates Vary by Course &amp; Experience
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Unlike fixed-price platforms, tutor rates on A+ Mentality reflect the university curriculum, course difficulty, and tutor experience. Rates typically range from <span className="font-semibold text-gray-900 dark:text-white">K100 to K300 per hour</span>.
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  When you book a session, you&apos;ll see the tutor&apos;s exact rate before confirming — no hidden fees, no surprises.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TUTORING MODALITIES ===== */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Choose Your Learning Style
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Three ways to get the tutoring you need, tailored to how you learn best.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modalities.map((modality) => {
              const Icon = modality.icon;
              return (
                <div
                  key={modality.name}
                  className="group relative rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 transition-shadow hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {modality.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {modality.description}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {modality.pros.map((pro) => (
                      <li key={pro} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/sign-up"
                    className="mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Book a Session
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="px-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Everything you need to know about our tutoring services.
            </p>
          </div>

          <div className="space-y-3">
            {faqData.map((faq, index) => (
              <AccordionItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaqIndex === index}
                onToggle={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="px-4 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-2xl bg-gray-900 dark:bg-neutral-800 p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-white">
              Ready to Start Learning?
            </h2>
            <p className="mt-3 text-gray-400 max-w-lg mx-auto">
              Join thousands of Zambian students accessing free study materials and premium tutoring.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-semibold transition"
              >
                Create Free Account
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white px-8 py-3 rounded-full font-semibold transition"
              >
                Read Our Docs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
