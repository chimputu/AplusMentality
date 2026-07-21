'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

const blurPlaceholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

interface ALevelCoursesProps {
  handleEnroll: (code: string) => void;
  handleViewAllALevels: () => void;
}

export default function ALevelCourses({ handleEnroll, handleViewAllALevels }: ALevelCoursesProps) {
  const aLevelCourses = [
    { id: 'al1', code: 'AL-BIO', title: 'A-Level Biology', description: 'Advanced cell biology, genetics, physiology, and ecology.', image: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=400&h=200&fit=crop', rating: 4.9, students: 850 },
    { id: 'al2', code: 'AL-CHEM', title: 'A-Level Chemistry', description: 'Advanced organic, inorganic, and physical chemistry.', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop', rating: 4.8, students: 720 },
    { id: 'al3', code: 'AL-PHY', title: 'A-Level Physics', description: 'Advanced mechanics, electromagnetism, and quantum physics.', image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=200&fit=crop', rating: 4.7, students: 680 },
    { id: 'al4', code: 'AL-MATH', title: 'A-Level Mathematics', description: 'Pure mathematics, statistics, and mechanics.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop', rating: 4.9, students: 1200 },
    { id: 'al5', code: 'AL-FMATH', title: 'A-Level Further Mathematics', description: 'Advanced pure mathematics and further mechanics.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', rating: 4.6, students: 450 },
    { id: 'al6', code: 'AL-ENG', title: 'A-Level English Literature', description: 'Advanced literary analysis and critical theory.', image: 'https://images.unsplash.com/photo-1544717305-996b815c338b?w=400&h=200&fit=crop', rating: 4.5, students: 560 },
    { id: 'al7', code: 'AL-HIST', title: 'A-Level History', description: 'Advanced historical analysis and historiography.', image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=200&fit=crop', rating: 4.4, students: 490 },
    { id: 'al8', code: 'AL-GEOG', title: 'A-Level Geography', description: 'Advanced physical geography, human geography, and GIS.', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=200&fit=crop', rating: 4.3, students: 380 },
  ];

  const [visibleCount, setVisibleCount] = useState(4);
  const loadMore = () => setVisibleCount((prev) => prev + 4);
  const hasMore = visibleCount < aLevelCourses.length;

  return (
    <div className="py-12 bg-gray-50">
      <div className="w-full px-2 sm:px-4">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">A-Level Courses</h2>
            <p className="text-gray-600">Advanced courses for university preparation and higher education</p>
          </div>
          <button
            onClick={handleViewAllALevels}
            className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
          >
            View All A-Levels <span className="text-lg">→</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {aLevelCourses.slice(0, visibleCount).map((course) => {
            const [ref, inView] = useInView({
              triggerOnce: true,
              threshold: 0.1,
            });

            return (
              <motion.div
                key={course.id}
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
                      <span className="text-gray-400 text-sm">({course.students} students)</span>
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
            );
          })}
        </div>

        {hasMore && (
          <div className="text-center mt-6">
            <button
              onClick={loadMore}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition"
            >
              Load More A-Levels
            </button>
          </div>
        )}
      </div>
    </div>
  );
}