'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  Menu, X, Mail, Phone, MapPin, Send,
  Share2, Globe, AtSign, Link as LinkIcon,
  ChevronLeft, ChevronRight, Quote, Star,
  Users, BookOpen, Award, Heart, Sparkles,
  GraduationCap, Target, Users as UsersIcon, CheckCircle,
  FileText, Book, Video, ClipboardList, MessageCircle, Briefcase, Crown,
  Compass, TrendingUp, PlayCircle, Megaphone, UserPlus,
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

// ✅ Fixed animation variants - TypeScript safe
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6 
    } 
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.15 
    },
  },
};

export default function HomePageClient() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [learnerCount, setLearnerCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [mentorCount, setMentorCount] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!statsRef.current || hasAnimated) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);
          const learnerInterval = setInterval(() => {
            setLearnerCount((prev) => {
              if (prev < 2500) return prev + 25;
              clearInterval(learnerInterval);
              return 2500;
            });
          }, 10);
          const videoInterval = setInterval(() => {
            setVideoCount((prev) => {
              if (prev < 120) return prev + 1;
              clearInterval(videoInterval);
              return 120;
            });
          }, 20);
          const mentorInterval = setInterval(() => {
            setMentorCount((prev) => {
              if (prev < 18) return prev + 1;
              clearInterval(mentorInterval);
              return 18;
            });
          }, 50);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  const [institutionRef] = useEmblaCarousel(
    { loop: true, align: 'start', containScroll: 'trimSnaps' },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );
  const [wisdomRef, wisdomApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  // ---- DATA ----
  const staticCourses = [
    { id: '1', code: 'BIO101', title: 'Introduction to Biology', description: 'Cell biology, genetics, and ecology.', year: 1, faculty: 'Natural Sciences', image: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=400&h=200&fit=crop', rating: 4.8, interested: 12000 },
    { id: '2', code: 'CHEM101', title: 'General Chemistry I', description: 'Atomic structure, bonding, and stoichiometry.', year: 1, faculty: 'Natural Sciences', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop', rating: 4.7, interested: 9500 },
    { id: '3', code: 'PHY101', title: 'General Physics I', description: 'Mechanics, thermodynamics, and waves.', year: 1, faculty: 'Natural Sciences', image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=200&fit=crop', rating: 4.6, interested: 8200 },
    { id: '4', code: 'MAT101', title: 'Calculus I', description: 'Limits, derivatives, and integrals.', year: 1, faculty: 'Natural Sciences', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', rating: 4.9, interested: 15000 },
    { id: '5', code: 'STA101', title: 'Introductory Statistics', description: 'Descriptive and inferential statistics.', year: 1, faculty: 'Natural Sciences', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', rating: 4.5, interested: 6500 },
    { id: '6', code: 'EVS101', title: 'Environmental Science', description: 'Ecosystems, biodiversity, and sustainability.', year: 1, faculty: 'Natural Sciences', image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=200&fit=crop', rating: 4.4, interested: 5400 },
    { id: '7', code: 'CSC101', title: 'Introduction to Computer Science', description: 'Foundations of computing, algorithms, and programming.', year: 1, faculty: 'Computer Science', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=200&fit=crop', rating: 4.9, interested: 22000 },
    { id: '8', code: 'CSC102', title: 'Programming Fundamentals', description: 'Introduction to programming using Python.', year: 1, faculty: 'Computer Science', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop', rating: 4.8, interested: 18000 },
    { id: '9', code: 'CSC103', title: 'Discrete Mathematics', description: 'Logic, sets, relations, and combinatorial mathematics.', year: 1, faculty: 'Computer Science', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', rating: 4.6, interested: 10200 },
    { id: '10', code: 'CSC104', title: 'Data Structures and Algorithms', description: 'Basic data structures and algorithm analysis.', year: 1, faculty: 'Computer Science', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop', rating: 4.7, interested: 13500 },
    { id: '11', code: 'CSC105', title: 'Web Development Basics', description: 'HTML, CSS, and JavaScript fundamentals.', year: 1, faculty: 'Computer Science', image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=200&fit=crop', rating: 4.5, interested: 7800 },
    { id: '12', code: 'CSC106', title: 'Database Systems', description: 'Introduction to relational databases and SQL.', year: 1, faculty: 'Computer Science', image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=200&fit=crop', rating: 4.6, interested: 9100 },
  ];

  const aLevelCourses = [
    { id: 'al1', code: 'AL-BIO', title: 'A-Level Biology', description: 'Advanced cell biology, genetics, and physiology.', image: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=400&h=200&fit=crop', rating: 4.9, interested: 8500 },
    { id: 'al2', code: 'AL-CHEM', title: 'A-Level Chemistry', description: 'Advanced organic, inorganic, and physical chemistry.', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop', rating: 4.8, interested: 7200 },
    { id: 'al3', code: 'AL-PHY', title: 'A-Level Physics', description: 'Advanced mechanics, electromagnetism, and quantum physics.', image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=200&fit=crop', rating: 4.7, interested: 6800 },
    { id: 'al4', code: 'AL-MATH', title: 'A-Level Mathematics', description: 'Pure mathematics, statistics, and mechanics.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', rating: 4.9, interested: 12000 },
    { id: 'al5', code: 'AL-FMATH', title: 'A-Level Further Mathematics', description: 'Advanced pure mathematics and further mechanics.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', rating: 4.6, interested: 4500 },
    { id: 'al6', code: 'AL-ENG', title: 'A-Level English Literature', description: 'Advanced literary analysis and critical theory.', image: 'https://images.unsplash.com/photo-1544717305-996b815c338b?w=400&h=200&fit=crop', rating: 4.5, interested: 5600 },
    { id: 'al7', code: 'AL-HIST', title: 'A-Level History', description: 'Advanced historical analysis and historiography.', image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=200&fit=crop', rating: 4.4, interested: 4900 },
    { id: 'al8', code: 'AL-GEO', title: 'A-Level Geography', description: 'Advanced physical and human geography.', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=200&fit=crop', rating: 4.3, interested: 3800 },
  ];

  const offerings = [
    { icon: <Users className="w-8 h-8 text-blue-600" />, title: 'Expert Tutors', description: 'Learn from qualified professionals and industry experts.' },
    { icon: <FileText className="w-8 h-8 text-blue-600" />, title: 'Lecture Slides', description: 'Access comprehensive slide decks for each course.' },
    { icon: <ClipboardList className="w-8 h-8 text-blue-600" />, title: 'Past Exam Papers', description: 'Practice with past papers to ace your exams.' },
    { icon: <Book className="w-8 h-8 text-blue-600" />, title: 'E-Books & Notes', description: 'Download curated e-books and study notes.' },
    { icon: <Video className="w-8 h-8 text-blue-600" />, title: 'Video Lessons', description: 'Engaging video tutorials on every topic.' },
    { icon: <Award className="w-8 h-8 text-blue-600" />, title: 'Interactive Quizzes', description: 'Test your knowledge with instant feedback.' },
    { icon: <MessageCircle className="w-8 h-8 text-blue-600" />, title: 'Mentorship & Support', description: 'Get one-on-one guidance from your mentors.' },
    { icon: <Briefcase className="w-8 h-8 text-blue-600" />, title: 'Career Guidance', description: 'Prepare for your future with career resources.' },
  ];

  const testimonials = [
    { id: 1, name: 'Sarah Mwansa', role: 'Medical Student', quote: 'A+ Mentality has completely transformed how I learn. The curated videos and announcements keep me ahead of my peers.', rating: 5 },
    { id: 2, name: 'David Banda', role: 'Engineering Graduate', quote: 'The mentorship platform is a game-changer. I finally feel supported in my academic journey.', rating: 5 },
    { id: 3, name: 'Grace Phiri', role: 'High School Student', quote: 'The announcements are always timely, and the videos make complex topics easy to understand.', rating: 4 },
  ];

  const institutions = [
    { name: 'University of Zambia', logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150&h=150&fit=crop' },
    { name: 'Copperbelt University', logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=150&h=150&fit=crop' },
    { name: 'Mulungushi University', logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=150&h=150&fit=crop' },
    { name: 'Lusaka Apex Medical University', logo: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&h=150&fit=crop' },
    { name: 'Zambia Open University', logo: 'https://images.unsplash.com/photo-1544717305-996b815c338b?w=150&h=150&fit=crop' },
    { name: 'Cavendish University', logo: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150&h=150&fit=crop' },
  ];

  const aLevelSubjects = [
    { name: 'Biology', grade: 'A+', color: 'bg-green-100 text-green-800' },
    { name: 'Chemistry', grade: 'A+', color: 'bg-blue-100 text-blue-800' },
    { name: 'Physics', grade: 'A+', color: 'bg-purple-100 text-purple-800' },
    { name: 'Mathematics', grade: 'A+', color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Further Mathematics', grade: 'A+', color: 'bg-red-100 text-red-800' },
    { name: 'English Literature', grade: 'A*', color: 'bg-pink-100 text-pink-800' },
    { name: 'History', grade: 'A+', color: 'bg-indigo-100 text-indigo-800' },
    { name: 'Geography', grade: 'A+', color: 'bg-teal-100 text-teal-800' },
    { name: 'Economics', grade: 'A+', color: 'bg-orange-100 text-orange-800' },
    { name: 'Psychology', grade: 'A+', color: 'bg-cyan-100 text-cyan-800' },
  ];

  const carouselSlides = [
    {
      title: 'Isaac Newton',
      description: '"What we know is a drop, what we don\'t know is an ocean."',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/GodfreyKneller-IsaacNewton-1689.jpg/440px-GodfreyKneller-IsaacNewton-1689.jpg',
      role: 'Physicist & Mathematician',
    },
    {
      title: 'Albert Einstein',
      description: '"Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world."',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/440px-Albert_Einstein_Head.jpg',
      role: 'Theoretical Physicist',
    },
    {
      title: 'Steve Jobs',
      description: '"Stay hungry, stay foolish."',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP.jpg/440px-Steve_Jobs_Headshot_2010-CROP.jpg',
      role: 'Entrepreneur & Inventor',
    },
    {
      title: 'Marie Curie',
      description: '"Nothing in life is to be feared, it is only to be understood."',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/440px-Marie_Curie_c._1920s.jpg',
      role: 'Physicist & Chemist',
    },
    {
      title: 'Nelson Mandela',
      description: '"Education is the most powerful weapon which you can use to change the world."',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/440px-Nelson_Mandela_1994.jpg',
      role: 'Statesman & Activist',
    },
  ];

  const exploreItems = [
    { icon: <TrendingUp className="w-6 h-6" />, title: 'Trending Now', description: 'Discover what\'s popular among learners this week.', color: 'hover:bg-red-50 hover:border-red-300 hover:shadow-red-100' },
    { icon: <PlayCircle className="w-6 h-6" />, title: 'Watch Videos', description: 'Access thousands of educational videos and tutorials.', color: 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-blue-100' },
    { icon: <Compass className="w-6 h-6" />, title: 'GfG Coding Contest', description: 'Participate in coding challenges and win prizes.', color: 'hover:bg-green-50 hover:border-green-300 hover:shadow-green-100' },
    { icon: <Megaphone className="w-6 h-6" />, title: 'Advertise with Us', description: 'Reach thousands of students and educators.', color: 'hover:bg-yellow-50 hover:border-yellow-300 hover:shadow-yellow-100' },
    { icon: <Briefcase className="w-6 h-6" />, title: 'Career Guidance', description: 'Get expert advice on career paths and opportunities.', color: 'hover:bg-purple-50 hover:border-purple-300 hover:shadow-purple-100' },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 4000);
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

  const handleViewAllALevels = () => {
    if (!isSignedIn) {
      router.push('/sign-up');
    } else {
      router.push('/alevel');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
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
              <div className="bg-gray-100 text-gray-700 text-[10px] font-medium px-2.5 py-1 rounded-full border border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(147,51,234,0.3)] animate-pulse">
                Owned by SmartCorp
              </div>
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
            <div className="text-xs text-gray-500 text-center">Owned by SmartCorp</div>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        className="pt-20 pb-10 md:pt-24 md:pb-12 bg-gradient-to-br from-blue-50 via-white to-blue-50"
      >
        <div className="w-full px-2 sm:px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex-[2] text-center lg:text-left">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4 mr-1" /> Empowering Lifelong Learning
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Learn, Grow, and <span className="text-blue-600">Thrive</span>
              </h1>
              <p className="mt-3 text-lg md:text-xl font-semibold text-blue-700">
                From being a C student to an A+ student, clear with excellent results –{' '}
                <span className="text-blue-600">your academic journey of A+'s begins here.</span>
              </p>
              <p className="mt-4 text-lg text-gray-600">
                A+ Mentality provides curated educational content, mentorship, and a supportive community
                to help you achieve your academic and career goals.
              </p>
              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                <Link href="/sign-up" className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                  Start Learning Free
                </Link>
                <Link href="/sign-in" className="bg-gray-200 text-gray-800 px-8 py-3 rounded-full font-medium hover:bg-gray-300 transition">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm lg:max-w-md">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-300 to-blue-400 rounded-2xl blur-3xl opacity-30" />
                <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                  <div className="space-y-4" ref={statsRef}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Active Learners</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {learnerCount >= 1000 ? (learnerCount / 1000).toFixed(1) + 'K+' : learnerCount + '+'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Educational Videos</p>
                        <p className="text-2xl font-bold text-gray-900">{videoCount}+</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Award className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Certified Mentors</p>
                        <p className="text-2xl font-bold text-gray-900">{mentorCount}+</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== MUST EXPLORE ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-16 bg-white"
      >
        <div className="w-full px-2 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Compass className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Must Explore</h2>
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
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="w-full py-12 bg-gradient-to-br from-blue-50 to-blue-100/50"
      >
        <div className="w-full px-2 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Crown className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">What We Offer</h2>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Everything you need to succeed in your academic journey – all in one place.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {offerings.map((item, idx) => (
              <motion.div key={idx} variants={fadeInUp} className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-xl transition border border-blue-100/50">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">{item.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                <p className="text-gray-600 text-sm mt-2">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== OUR AIM ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        className="py-12 bg-gray-50"
      >
        <div className="w-full px-2 sm:px-4">
          <div className="text-center mb-10">
            <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Our Aim</h2>
            <p className="mt-2 text-gray-600 max-w-3xl mx-auto">
              At <span className="font-semibold text-blue-600">A+ Mentality</span>, we believe that every student deserves access to high-quality education and mentorship.
              Our mission is to bridge the gap between traditional learning and modern technology by providing:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition">
              <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">Curated Content</h3>
              <p className="text-gray-600 text-sm mt-2">Handpicked videos, courses, and resources tailored to the Zambian curriculum and beyond.</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition">
              <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">Expert Mentorship</h3>
              <p className="text-gray-600 text-sm mt-2">Learn from experienced professionals, industry leaders, and academic scholars who guide you every step of the way.</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition">
              <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">Community Support</h3>
              <p className="text-gray-600 text-sm mt-2">Join a vibrant community of learners, share ideas, collaborate, and grow together.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== A-LEVEL COURSES (Quick Badges) ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-12 bg-white"
      >
        <div className="w-full px-2 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">All A-Level Courses</h2>
            <p className="mt-2 text-gray-600">Offering the highest quality tuition for A-Level subjects</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {aLevelSubjects.map((subject, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className={`${subject.color} rounded-xl p-4 text-center shadow-sm hover:shadow-md transition flex flex-col items-center`}
                onClick={handleExplore}
              >
                <span className="text-sm font-bold text-gray-800">{subject.name}</span>
                <span className="text-2xl font-extrabold text-gray-900">{subject.grade}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== FIRST-YEAR COURSES ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-12 bg-gray-50"
      >
        <div className="w-full px-2 sm:px-4">
          <div className="flex flex-wrap items-center justify-between mb-8">
            <motion.div variants={fadeInUp}>
              <h2 className="text-3xl font-bold text-gray-900">First-Year Courses</h2>
              <p className="text-gray-600">Foundational courses in Natural Sciences and Computer Science</p>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <button
                onClick={handleViewAllCourses}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                View All <span className="text-lg">→</span>
              </button>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {staticCourses.slice(0, 8).map((course) => (
              <motion.div
                key={course.id}
                variants={fadeInUp}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition flex flex-col"
                onClick={handleExplore}
              >
                <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {course.code}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    {course.faculty}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 flex-1">{course.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-semibold text-gray-800">{course.rating}</span>
                      <span className="text-gray-400 text-sm">({course.interested.toLocaleString()} interested)</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnroll(course.code);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-full transition"
                    >
                      Explore now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== A-LEVEL COURSES (Detailed Cards) ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-12 bg-white"
      >
        <div className="w-full px-2 sm:px-4">
          <div className="flex flex-wrap items-center justify-between mb-8">
            <motion.div variants={fadeInUp}>
              <h2 className="text-3xl font-bold text-gray-900">A-Level Courses</h2>
              <p className="text-gray-600">Advanced courses for higher education and university preparation</p>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <button
                onClick={handleViewAllALevels}
                className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
              >
                View All A-Levels <span className="text-lg">→</span>
              </button>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {aLevelCourses.map((course) => (
              <motion.div
                key={course.id}
                variants={fadeInUp}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition flex flex-col"
                onClick={handleExplore}
              >
                <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {course.code}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    A-Level
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 flex-1">{course.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-semibold text-gray-800">{course.rating}</span>
                      <span className="text-gray-400 text-sm">({course.interested.toLocaleString()} interested)</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnroll(course.code);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-1.5 rounded-full transition"
                    >
                      Explore now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== SIGN UP AS A TUTOR ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        className="py-12 bg-gradient-to-r from-blue-50 to-purple-50"
      >
        <div className="w-full px-2 sm:px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12 text-center max-w-4xl mx-auto">
            <UserPlus className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Become a Tutor</h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              Share your knowledge and expertise with thousands of students. Join our community of professional tutors and make a difference.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-6 py-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-800">+260 97 123 4567</span>
              </div>
              <Link
                href="/contact"
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition shadow-md inline-flex items-center gap-2"
              >
                Contact Us <span className="text-lg">→</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== ADVERTISE WITH US ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        className="py-12 bg-blue-50"
      >
        <div className="w-full px-2 sm:px-4 flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl shadow-md border border-gray-200 p-8 md:p-12">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Interested in advertising with us?</h2>
            <p className="text-gray-600 mt-1">Get in touch and reach thousands of students and educators.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/contact"
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition shadow-md inline-flex items-center gap-2"
            >
              Get in touch <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ===== WORDS OF WISDOM ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        className="relative py-16 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1600&h=800&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative w-full px-2 sm:px-4 z-10">
          <div className="text-center mb-10 text-white">
            <h2 className="text-3xl font-bold">Words of Wisdom from Great Minds</h2>
            <p className="mt-2 text-blue-200">Stay inspired with timeless wisdom from history's greatest thinkers</p>
          </div>
          <div className="relative">
            <div className="overflow-hidden" ref={wisdomRef}>
              <div className="flex">
                {carouselSlides.map((slide, index) => (
                  <div key={index} className="flex-[0_0_100%] min-w-0 px-2">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 text-center flex flex-col items-center text-white">
                      <div className="flex justify-center mb-4">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white/50 shadow-xl"
                        />
                      </div>
                      <h3 className="text-2xl font-bold">{slide.title}</h3>
                      <p className="text-sm text-blue-200 font-medium">{slide.role}</p>
                      <p className="mt-3 text-lg italic max-w-2xl">"{slide.description}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => wisdomApi?.scrollPrev()} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 bg-white/20 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white/40 transition z-10">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => wisdomApi?.scrollNext()} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 bg-white/20 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white/40 transition z-10">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ===== TESTIMONIALS ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-12 bg-white"
      >
        <div className="w-full px-2 sm:px-4">
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">What Our Community Says</h2>
            <p className="mt-2 text-gray-600">Real stories from real learners</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((t) => (
              <motion.div key={t.id} variants={fadeInUp} className="bg-gray-50 rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
                <div className="flex items-start space-x-1 text-yellow-500 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <div className="flex items-start space-x-1">
                  <Quote className="w-8 h-8 text-blue-400 flex-shrink-0 opacity-50" />
                  <p className="text-gray-700 italic">"{t.quote}"</p>
                </div>
                <div className="mt-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">{t.name.charAt(0)}</div>
                  <div><p className="text-sm font-medium text-gray-800">{t.name}</p><p className="text-xs text-gray-500">{t.role}</p></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ===== WORD OF ENCOURAGEMENT ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        className="py-12 bg-blue-600 text-white"
      >
        <div className="w-full px-2 sm:px-4 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-blue-200" />
          <h2 className="text-3xl font-bold">You Are Capable of Great Things</h2>
          <p className="mt-4 text-lg text-blue-100">
            Every expert was once a beginner. Keep learning, keep growing, and never give up.
            Your future is bright, and we're here to help you shine.
          </p>
          <div className="mt-8">
            <Link href="/sign-up" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-medium hover:bg-blue-50 transition shadow-lg">
              Join Our Community
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ===== INSTITUTIONS CAROUSEL ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        className="py-10 bg-white"
      >
        <div className="w-full px-2 sm:px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Our Partner Institutions</h2>
            <p className="text-sm text-gray-600">Proudly collaborating with leading universities</p>
          </div>
          <div className="overflow-hidden" ref={institutionRef}>
            <div className="flex">
              {institutions.concat(institutions).map((inst, idx) => (
                <div key={idx} className="flex-[0_0_25%] md:flex-[0_0_16.666%] min-w-0 px-2">
                  <div className="flex flex-col items-center">
                    <img
                      src={inst.logo}
                      alt={inst.name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-blue-200 shadow-md"
                    />
                    <span className="text-xs text-center mt-1 font-medium text-gray-700 truncate w-full">
                      {inst.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="w-full px-2 sm:px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A+</span>
                </div>
                <span className="text-xl font-bold text-white">Mentality</span>
              </Link>
              <p className="mt-4 text-sm text-gray-400">Empowering lifelong learning through curated content and community support.</p>
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
                <li><Link href="/about" className="hover:text-blue-400 transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-blue-400 transition">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-blue-400 transition">FAQ</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2"><Mail className="w-4 h-4 text-blue-400" /><span>support@amentality.com</span></li>
                <li className="flex items-center space-x-2"><Phone className="w-4 h-4 text-blue-400" /><span>+260 97 123 4567</span></li>
                <li className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-blue-400" /><span>Lusaka, Zambia</span></li>
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
                <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition flex items-center justify-center space-x-2">
                  <span>Subscribe</span><Send className="w-4 h-4" />
                </button>
                {isSubscribed && <p className="text-green-400 text-sm text-center">✅ Subscribed successfully!</p>}
              </form>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} A+ Mentality. All rights reserved. Built with ❤️ for lifelong learners.
          </div>
        </div>
      </footer>
    </div>
  );
}