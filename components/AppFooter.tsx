import Link from 'next/link';
import { Shield, Lock, Mail, Phone, MapPin, Cookie, Scale, Heart } from 'lucide-react';

const trustBadges = [
  {
    icon: <Lock className="w-5 h-5" />,
    label: 'SSL Encrypted',
    description: '256-bit encryption',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    label: 'SOC 2 Auth',
    description: 'Via Clerk Identity',
  },
  {
    icon: <Cookie className="w-5 h-5" />,
    label: 'GDPR Ready',
    description: 'Cookie consent',
  },
];

const legalLinks = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/robots.txt', label: 'Robots.txt' },
  { href: '/sitemap.xml', label: 'Sitemap' },
];

const platformLinks = [
  { href: '/explore', label: 'Explore Courses' },
  { href: '/sign-in', label: 'Sign In' },
  { href: '/sign-up', label: 'Sign Up' },
  { href: '/apply-as-tutor', label: 'Become a Tutor' },
  { href: '/download', label: 'Download App' },
];

export default function AppFooter() {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-800">
      {/* Trust badges */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {trustBadges.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-3 p-4 rounded-xl bg-neutral-900 border border-neutral-800"
            >
              <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center text-green-400 flex-shrink-0">
                {badge.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {badge.label}
                </p>
                <p className="text-xs text-gray-400">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>support@aplusmentality.vercel.app</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+260 97 000 0000</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Lusaka, Zambia</span>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              About
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              A+ Mentality is a learning management platform built for Zambian universities,
              providing courses, quizzes, assignments, past papers, and tutor services.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} A+ Mentality</span>
            <span className="flex items-center gap-0.5">
              Made with <Heart className="w-3.5 h-3.5 text-red-500" /> in Zambia
            </span>
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1"
            >
              <Scale className="w-3.5 h-3.5" />
              Privacy
            </Link>
            <span className="text-gray-500">•</span>
            <Link
              href="/terms-of-service"
              className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1"
            >
              <Scale className="w-3.5 h-3.5" />
              Terms
            </Link>
            <span className="text-gray-500">•</span>
            <Link
              href="/api/health"
              className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
