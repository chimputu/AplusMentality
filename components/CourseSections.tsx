'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

// Tiny blur placeholder
const blurPlaceholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

interface CourseSectionsProps {
  handleEnroll: (code: string) => void;
}

export default function CourseSections({ handleEnroll }: CourseSectionsProps) {
  // ---- Data arrays (same as before) ----
  const semester1Courses = [
    { code: 'CHE111', title: 'Introductory Chemistry', description: 'Atomic structure, bonding, and stoichiometry.', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop', rating: 4.7, students: 950 },
    { code: 'BIO111', title: 'Bio-molecules and Cells', description: 'Cell biology, genetics, and molecular foundations.', image: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=400&h=200&fit=crop', rating: 4.8, students: 1200 },
    { code: 'PHY101', title: 'Fundamentals of Physics', description: 'Mechanics, thermodynamics, and waves.', image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=200&fit=crop', rating: 4.6, students: 820 },
    { code: 'MSM111', title: 'Mathematical Methods I', description: 'Limits, derivatives, and integrals.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', rating: 4.9, students: 1500 },
  ];

  const semester2Courses = [
    { code: 'BIO112', title: 'Molecular Biology and Genetics', description: 'DNA replication, transcription, and inheritance.', image: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=400&h=200&fit=crop', rating: 4.8, students: 1100 },
    { code: 'PHY102', title: 'Introductory Physics II', description: 'Electromagnetism, optics, and modern physics.', image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=200&fit=crop', rating: 4.5, students: 780 },
    { code: 'MSM112', title: 'Mathematical Methods II', description: 'Differential equations, vectors, and matrices.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', rating: 4.7, students: 1300 },
    { code: 'CHE112', title: 'Introductory Chemistry II', description: 'Organic chemistry, acids, and bases.', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop', rating: 4.6, students: 880 },
  ];

  const csSem1Courses = [
    { code: 'ICT402', title: 'Statistics and Empirical Methods for Computing', description: 'Statistical analysis, regression, and data interpretation.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', rating: 4.5, students: 650 },
    { code: 'ICT261', title: 'Intro to OOP and JAVA', description: 'Object-oriented programming principles with Java.', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop', rating: 4.8, students: 1800 },
    { code: 'ICT221', title: 'Computer Architecture', description: 'CPU design, memory hierarchy, and instruction sets.', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=200&fit=crop', rating: 4.6, students: 920 },
    { code: 'ICT241', title: 'Digital Design', description: 'Logic gates, flip-flops, and combinational circuits.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop', rating: 4.4, students: 540 },
    { code: 'ICT201', title: 'Discrete Mathematics', description: 'Logic, sets, relations, and graph theory.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', rating: 4.7, students: 1020 },
  ];

  const csSem2Courses = [
    { code: 'ICT222', title: 'Operating Systems', description: 'Process management, memory, and file systems.', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=200&fit=crop', rating: 4.6, students: 850 },
    { code: 'ICT242', title: 'Networking and Communication', description: 'OSI model, TCP/IP, and network security.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', rating: 4.5, students: 720 },
    { code: 'ICT202', title: 'Data Structures and Algorithms', description: 'Stacks, queues, trees, and sorting algorithms.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop', rating: 4.9, students: 2200 },
    { code: 'ICT262', title: 'Intermediate Java Programming', description: 'Advanced OOP, collections, and multithreading.', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop', rating: 4.7, students: 1350 },
    { code: 'ICT271', title: 'Databases', description: 'SQL, database design, and transaction management.', image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=200&fit=crop', rating: 4.8, students: 1600 },
  ];

  // ---- State for "Load More" ----
  const [visibleSem1, setVisibleSem1] = useState(4);
  const [visibleSem2, setVisibleSem2] = useState(4);
  const [visibleCsSem1, setVisibleCsSem1] = useState(5);
  const [visibleCsSem2, setVisibleCsSem2] = useState(5);

  // Helper to render a course card with useInView
  const CourseCard = ({ course, color, faculty }: any) => {
    const [ref, inView] = useInView({
      triggerOnce: true,
      threshold: 0.1,
    });

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={fadeInUp}
        className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition flex flex-col cursor-pointer"
        onClick={() => handleEnroll(course.code)}
      >
        <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
          <Image
            src={course.image}
            alt={course.title}
            width={400}
            height={200}
            className="w-full h-full object-cover"
            placeholder="blur"
            blurDataURL={blurPlaceholder}
            loading="lazy"
          />
          <div className={`absolute top-2 left-2 ${color} text-white text-xs font-semibold px-2 py-0.5 rounded-full`}>
            {course.code}
          </div>
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {faculty}
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{course.title}</h3>
          <p className="text-sm text-gray-600 mt-1 flex-1">{course.description}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-semibold text-gray-800">{course.rating}</span>
              <span className="text-gray-400 text-sm">({course.students} students)</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEnroll(course.code);
              }}
              className={`${color} hover:opacity-90 text-white text-sm font-medium px-4 py-1.5 rounded-full transition`}
            >
              Explore now
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Helper to render a section with a "Load More" button
  const CourseSection = ({
    title,
    semester,
    courses,
    visibleCount,
    setVisibleCount,
    color,
    faculty,
  }: any) => {
    const loadMore = () => setVisibleCount((prev: number) => prev + 4);
    const hasMore = visibleCount < courses.length;

    return (
      <div className="mb-12">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div>
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
              {semester}
            </span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{title}</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {courses.slice(0, visibleCount).map((course: any, idx: number) => (
            <CourseCard key={idx} course={course} color={color} faculty={faculty} />
          ))}
        </div>
        {hasMore && (
          <div className="text-center mt-6">
            <button
              onClick={loadMore}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition"
            >
              Load More Courses
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Year 1 - Semester 1 */}
      <CourseSection
        title="Natural Sciences Foundation"
        semester="2023/2024 - Semester 1"
        courses={semester1Courses}
        visibleCount={visibleSem1}
        setVisibleCount={setVisibleSem1}
        color="bg-blue-600"
        faculty="Natural Sciences"
      />

      {/* Year 1 - Semester 2 */}
      <CourseSection
        title="Natural Sciences Advanced"
        semester="2023/2024 - Semester 2"
        courses={semester2Courses}
        visibleCount={visibleSem2}
        setVisibleCount={setVisibleSem2}
        color="bg-blue-600"
        faculty="Natural Sciences"
      />

      {/* Year 2 - Semester 1 */}
      <CourseSection
        title="Computer Science Foundation"
        semester="2024/2025 - Semester 1"
        courses={csSem1Courses}
        visibleCount={visibleCsSem1}
        setVisibleCount={setVisibleCsSem1}
        color="bg-purple-600"
        faculty="Computer Science"
      />

      {/* Year 2 - Semester 2 */}
      <CourseSection
        title="Computer Science Advanced"
        semester="2024/2025 - Semester 2"
        courses={csSem2Courses}
        visibleCount={visibleCsSem2}
        setVisibleCount={setVisibleCsSem2}
        color="bg-purple-600"
        faculty="Computer Science"
      />
    </>
  );
}