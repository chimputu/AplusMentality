import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose the right plan for your academic needs — from free student access to tutor services and institutional licensing.',
};

const tiers = [
  {
    name: 'Free',
    description: 'Essential access for Zambian students getting started.',
    price: 'K0',
    period: 'forever',
    cta: 'Get Started',
    ctaHref: '/sign-up',
    highlighted: false,
    features: [
      'Access to free past papers',
      'Browse public courses',
      'Community forum access',
      'Basic quiz practice',
      'Email support',
    ],
    notIncluded: [
      'Tutor booking',
      'Premium lecture slides',
      'Priority support',
    ],
  },
  {
    name: 'Tutor',
    description: 'For tutors who want to offer their services to students.',
    price: 'Commission-based',
    period: 'per session',
    cta: 'Become a Tutor',
    ctaHref: '/sign-up',
    highlighted: true,
    features: [
      'Create a tutor profile',
      'Set your own availability',
      'Accept student bookings',
      'Receive payments via Mobile Money',
      'Analytics dashboard',
      'Priority student matching',
      'Dedicated tutor support',
    ],
    notIncluded: [],
  },
  {
    name: 'Institution',
    description: 'For universities and departments managing large cohorts.',
    price: 'Custom',
    period: 'contact us',
    cta: 'Contact Sales',
    ctaHref: '/contact',
    highlighted: false,
    features: [
      'Branded institution portal',
      'Admin dashboard & analytics',
      'Bulk user management',
      'Custom course curricula',
      'API access for integrations',
      'SLA & priority support',
      'Onboarding assistance',
    ],
    notIncluded: [],
  },
];

function CheckIcon() {
  return <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <section className="px-4 py-16 sm:py-24 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Whether you&apos;re a student, tutor, or institution — find a plan that fits your academic goals.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 sm:p-8 transition-shadow ${
                tier.highlighted
                  ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/10 bg-white dark:bg-neutral-900'
                  : 'border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}

              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {tier.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tier.description}
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm text-muted-foreground">
                    / {tier.period}
                  </span>
                )}
              </div>

              <Link
                href={tier.ctaHref}
                className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                  tier.highlighted
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                {tier.cta}
              </Link>

              {tier.features.length > 0 && (
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <CheckIcon />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {tier.notIncluded.length > 0 && (
                <>
                  <div className="my-5 h-px bg-gray-200 dark:bg-neutral-800" />
                  <ul className="space-y-3">
                    {tier.notIncluded.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="w-4 h-4 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                How do tutors get paid?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tutors receive payment via Mobile Money (MTN, Airtel, Zamtel) after each completed session. A small platform commission is deducted per booking.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Can students upgrade later?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Yes — students on the Free tier can upgrade at any time to access premium features like tutor booking and exclusive lecture slides.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                What does the Institution plan include?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The Institution plan provides a branded portal, admin analytics, bulk user management, and API access. Pricing is custom based on the number of users and required features.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
