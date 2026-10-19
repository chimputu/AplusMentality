import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Star, Users, MessageSquare, TrendingUp } from 'lucide-react';

export default async function TutorReviewsPage() {
  const { userId } = await requireAuth(['TUTOR']);

  // Fetch tutor profile
  let tutorProfile: any = null;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (dbUser) {
      tutorProfile = await prisma.tutor.findFirst({
        where: { userId: dbUser.id },
      });
    }
  } catch (err) {
    console.error('[TutorReviews] Failed to fetch tutor profile:', err);
  }

  if (!tutorProfile) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No tutor profile found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Your tutor profile is not yet set up.
          </p>
        </div>
      </div>
    );
  }

  // Fetch reviews/ratings for this tutor (via completed requests)
  let completedRequests: any[] = [];
  try {
    completedRequests = await prisma.tutorRequest.findMany({
      where: {
        tutorId: tutorProfile.id,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch (err) {
    console.error('[TutorReviews] Failed to fetch reviews:', err);
  }

  const reviews = (Array.isArray(completedRequests) ? completedRequests : []).map((r: any) => ({
    ...r,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  // Calculate average rating
  const ratedReviews = reviews.filter((r: any) => r.rating != null);
  const averageRating = ratedReviews.length
    ? ratedReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratedReviews.length
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ratings & Reviews</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          See student feedback on your tutoring sessions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {averageRating.toFixed(1)}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {reviews.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {reviews.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              No reviews yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Student reviews will appear here after completed tutoring sessions
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {reviews.map((review: any) => (
              <div
                key={review.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {review.studentName || 'Anonymous Student'}
                      </h3>
                      {review.rating && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {review.courseNeeded && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Course: {review.courseNeeded}
                      </p>
                    )}
                    {review.feedback && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        {review.feedback}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
