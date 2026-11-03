import type { Metadata } from 'next';
import PricingClient from './components/PricingClient';

export const metadata: Metadata = {
  title: 'Pricing — A+ Mentality',
  description: 'All study materials are free. Pay only for 1-on-1 tutoring that fits your schedule and budget.',
};

export default function PricingPage() {
  return <PricingClient />;
}
