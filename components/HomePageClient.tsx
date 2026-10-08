'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import * as Sentry from '@sentry/nextjs';
import { motion } from 'framer-motion';
import {
  Menu, X, Mail, Phone, MapPin, Send,
  Share2, Globe, AtSign, Link as LinkIcon,
  Quote, Star,
  Users, BookOpen, Award, Heart, Sparkles,
  GraduationCap, Target, Users as UsersIcon, CheckCircle,
  FileText, Book, Video, ClipboardList, MessageCircle, Briefcase, Crown,
  Compass, TrendingUp, PlayCircle, Megaphone, UserPlus,
} from 'lucide-react';
import BannerCarousel from '@/components/banner-carousel';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6 } 
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

// Mobile-safe animation: always visible, just fades in
const mobileSafe = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

  // ============================================================
  // ZAMBIA 2026 DATA — Based on HEA Gazette & University Websites
  // ============================================================

  const institutions = [
    { name: 'University of Zambia', logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150&h=150&fit=crop' },
    { name: 'Copperbelt University', logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=150&h=150&fit=crop' },
    { name: 'Mulungushi University', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIpJBpFlsIFSEqF7L6i5PbFavqeIGWQTNlcc0djaiqjw&s=10' },
    { name: 'Kwame Nkrumah University', logo: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&h=150&fit=crop' },
    { name: 'Chalimbana University', logo: 'https://lens.usercontent.google.com/image?vsrid=CKKXidTP16nSKRACGAEiJDVjNTJmNDA2LTQyZWYtNGFiYi05ODZhLTE0ZDZhYWJiOGM4NjKBASICZWgoG0JzCi5sZmUtZHVtbXk6OGE2MzdlNDctZmQ3OC00N2YxLTgzMzAtZjg3M2ZkMjAyNGUxEkEKPy9ibnMvZWgvYm9yZy9laC9ibnMvbGVucy1mcm9udGVuZC1hcGkvcHJvZC5sZW5zLWZyb250ZW5kLWFwaS8zNFoECgJlaDjIv4DRh-GVAw&gsessionid=aXf0uimykXqoBUjXLIIfz3RXeNmT2546IYBEk1vpmcsUpNVwZQm3hQ' },
    { name: 'Cavendish University Zambia', logo: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150&h=150&fit=crop' },
    { name: 'University of Lusaka', logo: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&h=150&fit=crop' },
    { name: 'ZCAS University', logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150&h=150&fit=crop' },
  ];

  const testimonials = [
    { id: 1, name: 'Sarah Mwansa', role: 'Medical Student, UNZA', quote: 'A+ Mentality has completely transformed how I learn. The curated videos and past papers keep me ahead of my peers.', rating: 5 },
    { id: 2, name: 'David Banda', role: 'Engineering Graduate, CBU', quote: 'The mentorship platform is a game-changer. I finally feel supported in my academic journey.', rating: 5 },
    { id: 3, name: 'Grace Phiri', role: 'Student, Lusaka', quote: 'The resources are amazing. The pathways make it easy to focus on what I need for university entrance.', rating: 5 },
  ];

  const exploreItems = [
    { icon: <TrendingUp className="w-6 h-6" />, title: 'Trending Now', description: 'Discover what\'s popular among Zambian learners.', color: 'hover:bg-red-50 hover:border-red-300' },
    { icon: <PlayCircle className="w-6 h-6" />, title: 'Watch Videos', description: 'Access educational videos aligned with the Zambian curriculum.', color: 'hover:bg-blue-50 hover:border-blue-300' },
    { icon: <Compass className="w-6 h-6" />, title: 'Course Pathways', description: 'Explore Natural Sciences and Computer Science.', color: 'hover:bg-green-50 hover:border-green-300' },
    { icon: <Megaphone className="w-6 h-6" />, title: 'Advertise with Us', description: 'Reach thousands of students across Zambia.', color: 'hover:bg-yellow-50 hover:border-yellow-300' },
    { icon: <Briefcase className="w-6 h-6" />, title: 'Career Guidance', description: 'Get expert advice on Zambian career opportunities.', color: 'hover:bg-purple-50 hover:border-purple-300' },
  ];

  // ============================================================
  // EMAILJS SUBSCRIPTION HANDLER (DYNAMIC IMPORT)
  // ============================================================
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      const emailjs = await import('@emailjs/browser');
      emailjs.init('lq3xCtY4KtS7Z-3Wf');
      const templateParams = {
        user_email: email,
        to_email: 'kafiswegchimputu@gmail.com',
        subject: 'New A+ Mentality Subscriber!',
        message: `A new student has subscribed with email: ${email}`,
      };
      const response = await emailjs.send(
        'service_fadklbd',
        '__ejs-test-mail-service__',
        templateParams
      );
      console.log('Email sent successfully:', response);
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 5000);
    } catch (error) {
      console.error('Failed to send email:', error);
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
    { code: 'CHE111', title: 'Introductory Chemistry', description: 'Atomic structure, bonding, and stoichiometry.', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop', rating: 4.7, students: 950 },
    { code: 'BIO111', title: 'Bio-molecules and Cells', description: 'Cell biology, genetics, and molecular foundations.', image: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=400&h=200&fit=crop', rating: 4.8, students: 1200 },
    { code: 'PHY101', title: 'Fundamentals of Physics', description: 'Mechanics, thermodynamics, and waves.', image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=200&fit=crop', rating: 4.6, students: 820 },
    { code: 'MSM111', title: 'Mathematical Methods I', description: 'Limits, derivatives, and integrals.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', rating: 4.9, students: 1500 },
    // Semester 2
    { code: 'BIO112', title: 'Molecular Biology and Genetics', description: 'DNA replication, transcription, and inheritance.', image: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=400&h=200&fit=crop', rating: 4.8, students: 1100 },
    { code: 'PHY102', title: 'Introductory Physics II', description: 'Electromagnetism, optics, and modern physics.', image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=200&fit=crop', rating: 4.5, students: 780 },
    { code: 'MSM112', title: 'Mathematical Methods II', description: 'Differential equations, vectors, and matrices.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', rating: 4.7, students: 1300 },
    { code: 'CHE112', title: 'Introductory Chemistry II', description: 'Organic chemistry, acids, and bases.', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop', rating: 4.6, students: 880 },
  ];

  const year2Courses = [
    // Semester 1
    { code: 'ICT402', title: 'Statistics and Empirical Methods for Computing', description: 'Statistical analysis, regression, and data interpretation.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', rating: 4.5, students: 650 },
    { code: 'ICT261', title: 'Intro to OOP and JAVA', description: 'Object-oriented programming principles with Java.', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop', rating: 4.8, students: 1800 },
    { code: 'ICT221', title: 'Computer Architecture', description: 'CPU design, memory hierarchy, and instruction sets.', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=200&fit=crop', rating: 4.6, students: 920 },
    { code: 'ICT241', title: 'Digital Design', description: 'Logic gates, flip-flops, and combinational circuits.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop', rating: 4.4, students: 540 },
    { code: 'ICT201', title: 'Discrete Mathematics', description: 'Logic, sets, relations, and graph theory.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', rating: 4.7, students: 1020 },
    // Semester 2
    { code: 'ICT222', title: 'Operating Systems', description: 'Process management, memory, and file systems.', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=200&fit=crop', rating: 4.6, students: 850 },
    { code: 'ICT242', title: 'Networking and Communication', description: 'OSI model, TCP/IP, and network security.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', rating: 4.5, students: 720 },
    { code: 'ICT202', title: 'Data Structures and Algorithms', description: 'Stacks, queues, trees, and sorting algorithms.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop', rating: 4.9, students: 2200 },
    { code: 'ICT262', title: 'Intermediate Java Programming', description: 'Advanced OOP, collections, and multithreading.', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop', rating: 4.7, students: 1350 },
    { code: 'ICT271', title: 'Databases', description: 'SQL, database design, and transaction management.', image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=200&fit=crop', rating: 4.8, students: 1600 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* ===== BANNERS ===== */}
      <BannerCarousel placement="HOMEPAGE" />

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-2 sm:px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A+</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Mentality</span>
            </Link>

            <div className="hidden md:flex items-center space-x-2">
              <Link href="/sign-in" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
              >
                Get Started
              </Link>
              <span className="w-px h-5 bg-gray-300 mx-1"></span>
              <Link href="https://smartcorp-zeta.vercel.app">
                <div className="bg-gray-100 text-gray-700 text-[10px] font-medium px-2.5 py-1 rounded-full border border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(147,51,234,0.3)] animate-pulse">
                  Owned by SmartCorp
                </div>
              </Link>
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-2 py-4 space-y-3">
            <Link href="/sign-in" className="block text-sm font-medium text-gray-700 hover:text-blue-600 transition" onClick={() => setIsMenuOpen(false)}>
              Sign In
            </Link>
            <Link href="/sign-up" className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition text-center" onClick={() => setIsMenuOpen(false)}>
              Get Started
            </Link>
            <Link href="https://smartcorp-zeta.vercel.app">
            <div className="text-xs text-gray-500 text-center">Owned by SmartCorp</div>
            </Link>
          </div>
        )}
      </nav>

      {/* ===== HERO – FACEBOOK-STYLE WELCOME ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="relative pt-20 pb-10 md:pt-24 md:pb-12 overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&h=800&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative w-full px-3 sm:px-4 z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">
            {/* Left – Text Content */}
            <div className="flex-[2] text-center lg:text-left w-full">
              <div className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-[1.2]">
                <span className="block">Your Goal.</span>
                <span className="block text-blue-300 ml-4 sm:ml-10">Our tools.</span>
                <span className="block text-xl sm:text-2xl lg:text-5xl font-normal text-gray-200 mt-2 ml-4 sm:ml-16">
                  Your <span className="text-blue-300 font-bold lg:text-5xl">A+</span> result.
                </span>
              </div>

              <p className="mt-4 text-base sm:text-lg text-gray-200 max-w-2xl mx-auto lg:mx-0">
                A+ Mentality helps students study smarter, stay organized, and track progress 
                so you can achieve more and stress less.
              </p>

              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                <Link href="/sign-up" className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                  Get Started Free
                </Link>
                <Link href="#explore" className="bg-white/20 backdrop-blur-sm text-white px-6 sm:px-8 py-3 rounded-full font-medium hover:bg-white/30 transition border border-white/30">
                  Explore Features
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-6 text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <span className="text-green-400">✓</span> Free to start
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-green-400">✓</span> Learn offline 
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-green-400">✓</span> Mentors available
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-green-400">✓</span> Built for Zambians
                </span>
              </div>
            </div>

            {/* Right – Hero Card with Brain & Icons */}
            <div className="flex-1 flex justify-center lg:justify-end w-full">
              <div className="relative w-full max-w-sm lg:max-w-md">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur-3xl opacity-20" />
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 sm:p-8 shadow-xl text-center">
                  <div className="flex justify-center mb-4">
                    
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Built for Zambian Students</h3>
                  <p className="text-blue-200 text-sm">By Zambians, for Zambians</p>

                  <div className="mt-6 flex justify-center gap-6 sm:gap-8 text-sm">
                    <div>
                      <p className="font-bold text-white text-lg"></p>
                      <p className="text-blue-200 text-xs">Quality Content</p>
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg"></p>
                      <p className="text-blue-200 text-xs">Expert Mentors</p>
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg"></p>
                      <p className="text-blue-200 text-xs">Learn Offline</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/20 text-center text-xs text-blue-200">
                    Join the A+ Mentality community today
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== FOUR PILLARS ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={staggerContainer}
        className="py-12 bg-white border-b border-gray-100"
      >
        <div className="w-full px-3 sm:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Study Smarter</h3>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Track Progress</h3>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Reach Your Goals</h3>
            </motion.div>
            <motion.div variants={fadeInUp} className="text-center p-4">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Crown className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Build an A+ Mindset</h3>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ===== MONTHLY OVERVIEW ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-12 bg-gray-50"
      >
        <div className="w-full px-3 sm:px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-200 p-5 sm:p-8 md:p-12">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                   Welcome back, Future Achiever!
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  Keep going. Great things take time.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs font-medium text-gray-500">Courses</p>
                <p className="text-2xl font-bold text-gray-900">6</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs font-medium text-gray-500">Study Hours</p>
                <p className="text-2xl font-bold text-gray-900">24.5</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-yellow-600">87%</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Study Planner:</span>
                <button className="text-sm px-3 py-1 rounded-full bg-blue-600 text-white">Today</button>
                <button className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition">This Week</button>
                <button className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition">This Month</button>
                <button className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition">This Year</button>
              </div>
              <Link
                href="/sign-up"
                className="text-blue-600 font-medium hover:text-blue-800 transition inline-flex items-center gap-1 text-sm"
              >
                Continue Learning <span className="text-lg">→</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== TOP ZAMBIAN UNIVERSITIES – FULL-WIDTH LOGO CARDS ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={staggerContainer}
        className="py-12 bg-white"
      >
        <div className="w-full px-3 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Top Zambian Universities</h2>
            <p className="mt-2 text-gray-600">
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
                className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 hover:scale-[1.04] transition-all duration-300 flex flex-col shadow-sm"
              >
                <div className="w-full h-28 sm:h-36 md:h-44 bg-gray-50 flex items-center justify-center overflow-hidden">
                  <Image
                    src={uni.logo}
                    alt={uni.name}
                    width={180}
                    height={120}
                    className="object-contain w-full h-full p-2"
                  />
                </div>
                <div className="p-3 sm:p-4 text-center border-t border-gray-100">
                  <h3 className="font-bold text-gray-800 text-xs sm:text-sm md:text-base group-hover:text-blue-600 transition-colors">
                    {uni.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{uni.location}</p>
                </div>
              </motion.div>
            ))}
          </div>

         
        </div>
      </motion.section>

      {/* ===== MUST EXPLORE ===== */}
      <motion.section
        id="explore"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={staggerContainer}
        className="py-16 bg-gray-50"
      >
        <div className="w-full px-3 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Compass className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Must Explore</h2>
            <p className="mt-2 text-gray-600">Discover the best of what A+ Mentality has to offer</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {exploreItems.map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className={`bg-white rounded-xl p-6 text-center shadow-sm border-2 border-gray-100 transition-all duration-300 cursor-pointer ${item.color} hover:scale-[1.02] hover:shadow-lg`}
                onClick={handleExplore}
              >
                <div className="flex justify-center mb-3 text-gray-700">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
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
        className="w-full py-12 bg-gradient-to-br from-blue-50 to-blue-100/50"
      >
        <div className="w-full px-3 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Crown className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What We Offer</h2>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Everything you need to succeed in your academic journey – all in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: 'Expert Tutors',
                description: 'Learn from qualified professionals.',
                image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop'
              },
              {
                title: 'Lecture Slides',
                description: 'Comprehensive slide decks for each course.',
                image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=400&fit=crop'
              },
              {
                title: 'Past Exam Papers',
                description: 'Practice with past papers from Zambia.',
                image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop'
              },
              {
                title: 'E-Books & Notes',
                description: 'Curated e-books and study notes.',
                image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop'
              },
              {
                title: 'Video Lessons',
                description: 'Engaging tutorials on every topic.',
                image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop'
              },
              {
                title: 'Interactive Quizzes',
                description: 'Test your knowledge with instant feedback.',
                image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop'
              },
              {
                title: 'Mentorship & Support',
                description: 'One-on-one guidance from mentors.',
                image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop'
              },
              {
                title: 'Career Guidance',
                description: 'Prepare for your future with career resources.',
                image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop'
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03] h-48 sm:h-56 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-400">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    priority={idx < 4}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                <div className="relative h-full flex flex-col justify-end p-5 text-white">
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-sm text-white/80 mt-1">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== OUR AIM ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-12 bg-white"
      >
        <div className="w-full px-3 sm:px-4">
          <div className="text-center mb-10">
            <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Aim</h2>
            <p className="mt-2 text-gray-600 max-w-3xl mx-auto">
              At <span className="font-semibold text-blue-600">A+ Mentality</span>, we believe that every Zambian student
              deserves access to high-quality education and mentorship. Our mission is to bridge the gap between
              traditional learning and modern technology by providing:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition border border-gray-100">
              <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">Curriculum-Aligned Content</h3>
              <p className="text-gray-600 text-sm mt-2">Handpicked videos, courses, and resources tailored to the Zambian curriculum and HEA standards.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition border border-gray-100">
              <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">Expert Mentorship</h3>
              <p className="text-gray-600 text-sm mt-2">Learn from experienced professionals, industry leaders, and academic scholars who guide you every step of the way.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition border border-gray-100">
              <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">Community Support</h3>
              <p className="text-gray-600 text-sm mt-2">Join a vibrant community of Zambian learners, share ideas, collaborate, and grow together.</p>
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
        className="py-12 bg-white"
      >
        <div className="w-full px-3 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Course Journey</h2>
            <p className="mt-2 text-gray-600 max-w-3xl mx-auto">
              From Natural Sciences to Computer Science – a complete academic pathway
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
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Natural Sciences Foundation</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {year1Courses.slice(0,4).map((course, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  className="group bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col cursor-pointer"
                  onClick={() => handleEnroll(course.code)}
                >
                  <div className="relative w-full aspect-[16/9] bg-gray-200 overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {course.code}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      Natural Sciences
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{course.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 flex-1">{course.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold text-gray-800">{course.rating}</span>
                        <span className="text-gray-400 text-xs sm:text-sm">({course.students})</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnroll(course.code);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full transition whitespace-nowrap"
                      >
                        Explore now
                      </button>
                    </div>
                  </div>
                </motion.div>
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
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Natural Sciences Advanced</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {year1Courses.slice(4).map((course, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  className="group bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col cursor-pointer"
                  onClick={() => handleEnroll(course.code)}
                >
                  <div className="relative w-full aspect-[16/9] bg-gray-200 overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {course.code}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      Natural Sciences
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{course.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 flex-1">{course.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold text-gray-800">{course.rating}</span>
                        <span className="text-gray-400 text-xs sm:text-sm">({course.students})</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnroll(course.code);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full transition whitespace-nowrap"
                      >
                        Explore now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ===== YEAR 2 - Semester 1 ===== */}
          <motion.div variants={fadeInUp} className="mb-12">
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div>
                <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Year 2 - Semester 1
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Computer Science Foundation</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {year2Courses.slice(0,5).map((course, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  className="group bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col cursor-pointer"
                  onClick={() => handleEnroll(course.code)}
                >
                  <div className="relative w-full aspect-[16/9] bg-gray-200 overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {course.code}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      Computer Science
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{course.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 flex-1">{course.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold text-gray-800">{course.rating}</span>
                        <span className="text-gray-400 text-xs sm:text-sm">({course.students})</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnroll(course.code);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full transition whitespace-nowrap"
                      >
                        Explore now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ===== YEAR 2 - Semester 2 ===== */}
          <motion.div variants={fadeInUp}>
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div>
                <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Year 2 - Semester 2
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Computer Science Advanced</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {year2Courses.slice(5).map((course, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  className="group bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col cursor-pointer"
                  onClick={() => handleEnroll(course.code)}
                >
                  <div className="relative w-full aspect-[16/9] bg-gray-200 overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {course.code}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      Computer Science
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{course.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 flex-1">{course.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold text-gray-800">{course.rating}</span>
                        <span className="text-gray-400 text-xs sm:text-sm">({course.students})</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnroll(course.code);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full transition whitespace-nowrap"
                      >
                        Explore now
                      </button>
                    </div>
                  </div>
                </motion.div>
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
        className="py-12 bg-white"
      >
        <div className="w-full px-3 sm:px-4">
          <div className="text-center mb-10">
            <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Zambian University Grading System</h2>
            
          </div>

          {/* ===== GRADING POINTS SYSTEM ===== */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Grading Points System</h3>
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Grade</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Points</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Percentage</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="bg-green-50 hover:bg-green-100 transition">
                      <td className="px-3 sm:px-4 py-3 font-bold text-green-700 text-sm">A+</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-gray-800 text-sm">2.5</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 text-sm">86 and above</td>
                      <td className="px-3 sm:px-4 py-3 text-green-700 font-medium text-sm">Upper Distinction</td>
                    </tr>
                    <tr className="bg-green-50/50 hover:bg-green-100 transition">
                      <td className="px-3 sm:px-4 py-3 font-bold text-green-700 text-sm">A</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-gray-800 text-sm">2.0</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 text-sm">76 – 85</td>
                      <td className="px-3 sm:px-4 py-3 text-green-700 font-medium text-sm">Distinction</td>
                    </tr>
                    <tr className="bg-blue-50 hover:bg-blue-100 transition">
                      <td className="px-3 sm:px-4 py-3 font-bold text-blue-700 text-sm">B+</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-gray-800 text-sm">1.5</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 text-sm">66 – 75</td>
                      <td className="px-3 sm:px-4 py-3 text-blue-700 font-medium text-sm">Merit</td>
                    </tr>
                    <tr className="bg-blue-50/50 hover:bg-blue-100 transition">
                      <td className="px-3 sm:px-4 py-3 font-bold text-blue-700 text-sm">B</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-gray-800 text-sm">1.0</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 text-sm">60 – 65</td>
                      <td className="px-3 sm:px-4 py-3 text-blue-700 font-medium text-sm">Credit</td>
                    </tr>
                    <tr className="bg-yellow-50 hover:bg-yellow-100 transition">
                      <td className="px-3 sm:px-4 py-3 font-bold text-yellow-700 text-sm">C+</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-gray-800 text-sm">0.5</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 text-sm">55 – 59</td>
                      <td className="px-3 sm:px-4 py-3 text-yellow-700 font-medium text-sm">Clear Pass</td>
                    </tr>
                    <tr className="bg-yellow-50/50 hover:bg-yellow-100 transition">
                      <td className="px-3 sm:px-4 py-3 font-bold text-yellow-700 text-sm">C</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-gray-800 text-sm">0.25</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 text-sm">50 – 54</td>
                      <td className="px-3 sm:px-4 py-3 text-yellow-700 font-medium text-sm">Bare Pass</td>
                    </tr>
                    <tr className="bg-red-50 hover:bg-red-100 transition">
                      <td className="px-3 sm:px-4 py-3 font-bold text-red-700 text-sm">D+</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-gray-800 text-sm">0</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 text-sm">45 – 49</td>
                      <td className="px-3 sm:px-4 py-3 text-red-700 font-medium text-sm">Bare Fail</td>
                    </tr>
                    <tr className="bg-red-50/50 hover:bg-red-100 transition">
                      <td className="px-3 sm:px-4 py-3 font-bold text-red-700 text-sm">D</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-gray-800 text-sm">0</td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 text-sm">44 and below</td>
                      <td className="px-3 sm:px-4 py-3 text-red-700 font-medium text-sm">Fail</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ===== DEGREE CLASSIFICATION SYSTEM ===== */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4">
              <h3 className="text-lg sm:text-xl font-bold text-white text-center">Degree Classification System</h3>
              <p className="text-blue-100 text-xs sm:text-sm text-center mt-1">
                Based on cumulative points from 20 courses at 3rd &amp; 4th Year Levels (4-Year programmes)<br />
                or 4th &amp; 5th Year Levels (5-Year programmes)
              </p>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Cumulative Points</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Degree Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-green-50 transition">
                    <td className="px-3 sm:px-4 py-4 font-bold text-green-700 text-sm">40 Points and above</td>
                    <td className="px-3 sm:px-4 py-4">
                      <span className="inline-block bg-green-100 text-green-800 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
                         Distinction
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50 transition">
                    <td className="px-3 sm:px-4 py-4 font-bold text-blue-700 text-sm">30 – 39.9 Points</td>
                    <td className="px-3 sm:px-4 py-4">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
                         Merit
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-yellow-50 transition">
                    <td className="px-3 sm:px-4 py-4 font-bold text-yellow-700 text-sm">20 – 29.9 Points</td>
                    <td className="px-3 sm:px-4 py-4">
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
                         Credit
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-4 py-4 font-bold text-gray-700 text-sm">Less than 20 Points</td>
                    <td className="px-3 sm:px-4 py-4">
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold">
                        Pass
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          
        </div>
      </motion.section>

      {/* ===== SIGN UP AS A TUTOR ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-12 bg-gradient-to-r from-blue-50 to-purple-50"
      >
        <div className="w-full px-3 sm:px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 md:p-12 text-center max-w-4xl mx-auto">
            <UserPlus className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Become a Tutor</h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              Share your knowledge and expertise with thousands of Zambian students.
              Join our community of professional tutors and make a difference.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-6 py-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-800">+260 954 953 610</span>
              </div>
              <a
                href="https://wa.me/260772231300"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-3 transition shadow-md"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-medium">WhatsApp</span>
              </a>
              <Link
                href="mailto:kafiswegchimputu@gmail.com"
                className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition shadow-md inline-flex items-center gap-2"
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
        className="py-12 bg-blue-50"
      >
        <div className="w-full px-3 sm:px-4 flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8 md:p-12 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Interested in advertising with us?</h2>
            <p className="text-gray-600 mt-1">Reach thousands of Zambian students and educators.</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowContactMenu(!showContactMenu)}
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition shadow-md inline-flex items-center gap-2"
            >
              Get in touch <span className="text-lg">→</span>
            </button>
            {showContactMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                <a
                  href="mailto:kafiswegchimputu@gmail.com?subject=Advertising%20Inquiry%20-%20A%2B%20Mentality"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition border-b border-gray-100"
                >
                  ✉️ Email Us
                </a>
                <a
                  href="https://wa.me/260772231300?text=Hi%2C%20I%27m%20interested%20in%20advertising%20with%20A%2B%20Mentality"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition"
                >
                  💬 WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ===== TESTIMONIALS ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-12 bg-white overflow-hidden"
      >
        <div className="w-full px-3 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What Our Community Says</h2>
            <p className="mt-2 text-gray-600">Real stories from real Zambian learners</p>
          </motion.div>

          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-12 sm:w-20 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 h-full w-12 sm:w-20 bg-gradient-to-l from-white to-transparent z-10" />

            <div
              className="flex gap-6 sm:gap-8"
              style={{
                animation: 'testimonialScroll 45s linear infinite',
                width: 'max-content',
              }}
            >
              {[...testimonials, ...testimonials, ...testimonials].map((t, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-2xl shadow-md p-5 sm:p-6 border border-gray-200 min-w-[280px] sm:min-w-[320px] max-w-[340px] flex-shrink-0"
                >
                  <div className="flex items-start space-x-1 text-yellow-500 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <div className="flex items-start space-x-1">
                    <Quote className="w-8 h-8 text-blue-400 flex-shrink-0 opacity-50" />
                    <p className="text-gray-700 italic text-sm">"{t.quote}"</p>
                  </div>
                  <div className="mt-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== MOTIVATIONAL SECTION ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-12 bg-white"
      >
        <div className="w-full px-3 sm:px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <div className="flex-1 text-center md:text-left w-full">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Why Choose <span className="text-blue-600">A+ Mentality</span>?
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Curriculum-Aligned Content</strong> – All materials follow the Zambian syllabus and HEA standards.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Expert Mentors</strong> – Learn from qualified professionals who guide you every step.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Community Support</strong> – Join thousands of like‑minded Zambian learners.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Progress Tracking</strong> – See your growth in real time and stay motivated.</span>
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                <Link
                  href="/sign-up"
                  className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition shadow-md inline-flex items-center gap-2"
                >
                  Join Now <span className="text-lg">→</span>
                </Link>
                <a
                  href="https://wa.me/260772231300"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-medium transition shadow-md inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="relative w-full rounded-xl overflow-hidden shadow-xl" style={{ paddingBottom: '56.25%' }}>
               <iframe
  className="absolute top-0 left-0 w-full h-full"
  src="https://www.youtube.com/embed/g6BtbIiJ_rc?start=36"
  title="A+ Student Mentality - Best Study Motivation"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  loading="lazy"
/>
              </div>
              
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== WORD OF ENCOURAGEMENT ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        variants={fadeInUp}
        className="py-12 bg-blue-600 text-white"
      >
        <div className="w-full px-3 sm:px-4 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-blue-200" />
          <h2 className="text-2xl sm:text-3xl font-bold">You Are Capable of Great Things</h2>
          <p className="mt-4 text-base sm:text-lg text-blue-100">
            Every expert was once a beginner. Keep learning, keep growing, and never give up.
            Your future is bright, and we're here to help you shine.
          </p>
          <div className="mt-8">
            <Link href="/sign-up" className="inline-block bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-full font-medium hover:bg-blue-50 transition shadow-lg">
              Join Our Community
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ===== PARTNER INSTITUTIONS ===== */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="w-full">
          <div className="text-center mb-10 px-3 sm:px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Aligns with Zambia's University Curriculum</h2>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Collaborating with Zambia's leading academic and financial institutions to support students.
            </p>
          </div>

          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-12 sm:w-16 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 h-full w-12 sm:w-16 bg-gradient-to-l from-white to-transparent z-10" />

            <div
              className="flex gap-4 sm:gap-6 items-center"
              style={{
                animation: 'scrollRightToLeft 35s linear infinite',
                width: 'max-content',
              }}
            >
              {[...institutions, ...institutions, ...institutions].map((inst, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 text-center hover:shadow-xl hover:border-blue-300 hover:scale-[1.05] transition-all duration-300 flex flex-col items-center justify-center min-w-[140px] sm:min-w-[160px] shadow-sm"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-blue-200 shadow-md flex items-center justify-center bg-gray-50">
                    <img
                      src={inst.logo}
                      alt={inst.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-3 text-xs sm:text-sm font-semibold text-gray-800 leading-tight">{inst.name}</p>
                  <span className="mt-1 text-[10px] text-gray-400">Partner Institution</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-8 px-3 sm:px-4">
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              View All Partners <span className="text-lg">→</span>
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 px-3 sm:px-4">
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="w-full px-3 sm:px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A+</span>
                </div>
                <span className="text-xl font-bold text-white">Mentality</span>
              </Link>
              <p className="mt-4 text-sm text-gray-400">
                Empowering Zambian lifelong learners through curated content, mentorship, and community support.
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition"><Share2 className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition"><Globe className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition"><AtSign className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition"><LinkIcon className="w-5 h-5" /></a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="https://smartcorp-zeta.vercel.app" className="hover:text-blue-400 transition">About Us</Link></li>
                <li><Link href="https://smartcorp-zeta.vercel.app/contact" className="hover:text-blue-400 transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <a href="mailto:kafiswegchimputu@gmail.com" className="hover:text-blue-400 transition">
                    kafiswegchimputu@gmail.com
                  </a>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span>+260 954 953 610</span>
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
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span>Lusaka, Zambia</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Subscribe to Our Newsletter</h4>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition flex items-center justify-center space-x-2"
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
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} A+ Mentality Zambia. All rights reserved. Built  for Zambian lifelong learners.
          </div>
        </div>
      </footer>

      {/* ===== KEYFRAMES ===== */}
      <style jsx>{`
        @keyframes scrollRightToLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes testimonialScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>

      {/* ===== FLOATING WHATSAPP BUTTON ===== */}
      <a
        href="https://wa.me/260772231300"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-20 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}