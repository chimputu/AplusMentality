import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Target, Users, GraduationCap, Mail, MapPin, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About A+ Mentality',
  description: 'Learn about A+ Mentality\'s mission to empower Zambian students through quality education.',
  alternates: {
    canonical: 'https://aplusmentality.vercel.app/about',
  },
};

const values = [
  {
    icon: <Target className="w-6 h-6" />,
    title: 'Our Mission',
    description:
      'To empower Zambian students with accessible, high-quality educational resources that bridge the gap between classroom learning and academic success.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Our Passion',
    description:
      'We believe every Zambian student deserves the tools to achieve an A+ mentality — the confidence, resources, and support to excel academically.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Our Community',
    description:
      'Built by Zambians, for Zambians. Our platform connects students, tutors, and institutions in a unified learning ecosystem across the country.',
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: 'Our Vision',
    description:
      'To become the leading educational platform in Zambia, supporting students from secondary school through university with curated content and mentorship.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-6 transition"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A+</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">About A+ Mentality</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Empowering Zambian lifelong learners through education
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 mb-8">
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-4">
            A+ Mentality is a Zambian educational technology platform designed to help students
            study smarter, stay organized, and track their academic progress. We provide curated
            past papers, study notes, video lessons, and mentorship to support learners across
            Zambia&apos;s universities and colleges.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-4">
            Our platform aligns with the curricula of Zambia&apos;s leading academic institutions,
            including the University of Zambia (UNZA), Copperbelt University (CBU), Mulungushi
            University (MU), and many others.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            Whether you&apos;re preparing for exams, looking for study materials, or seeking
            academic guidance, A+ Mentality is here to help you achieve your goals.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {values.map((value) => (
            <div
              key={value.title}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                {value.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {value.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* Team Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Our Team
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
            A+ Mentality is developed and maintained by SmartCorp, a Zambian technology company
            committed to building educational solutions that make a real difference. Our team
            consists of developers, educators, and content curators who are passionate about
            improving access to quality education in Zambia.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            We work closely with university students and lecturers to ensure our content remains
            relevant, accurate, and aligned with the latest curricula.
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Get in Touch
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <a
                href="mailto:kafiswegchimputu@gmail.com"
                className="text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                kafiswegchimputu@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                +260 954 953 610
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                Lusaka, Zambia
              </span>
            </div>
          </div>
        </div>

        {/* Bottom links */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 text-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium"
          >
            Back to Home
          </Link>
          <a
            href="https://smartcorp-zeta.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
          >
            Visit SmartCorp →
          </a>
        </div>
      </div>
    </div>
  );
}
