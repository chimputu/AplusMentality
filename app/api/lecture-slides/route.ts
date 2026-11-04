import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getScopeContext, buildCourseResourceScopeWhere, isUserAuthorizedForCourse } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);

        const courseId = searchParams.get('courseId');
        const category = searchParams.get('category');

        const institutionId =
            searchParams.get('institutionId') || searchParams.get('institution');

        const universityId =
            searchParams.get('universityId') || searchParams.get('university');

        // Pagination support to prevent timeout on large datasets
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
        const skip = (page - 1) * limit;

        // SECURITY: Resolve user's academic scope to filter slides
        const scope = await getScopeContext();
        const resourceScope = buildCourseResourceScopeWhere(scope);

        const where: any = {};

        if (courseId) where.courseId = courseId;
        if (category) where.category = category;

        // Tenant isolation: ADMIN can only query their own institution
        const finalInstitutionId = institutionId || universityId;
        if (scope.role === 'ADMIN' && finalInstitutionId) {
            if (finalInstitutionId !== scope.institutionId) {
                return NextResponse.json(
                    { error: 'Forbidden: You can only query slides in your own institution' },
                    { status: 403 }
                );
            }
        }

        if (finalInstitutionId) {
            where.course = {
                programme: {
                    institutionId: finalInstitutionId,
                },
            };
        }

        // Default ADMIN to their own institution if no institutionId provided
        if (scope.role === 'ADMIN' && scope.institutionId && !finalInstitutionId) {
            where.course = { programme: { institutionId: scope.institutionId } };
        }

        // Apply scope filtering for non-admin users
        if (scope.role !== 'ADMIN' && scope.role !== 'SUPER_ADMIN') {
            Object.assign(where, resourceScope);
        }

        // Only fetch fields the student UI actually needs — avoid deep joins
        // that cause timeouts (programme → institution, etc.)
        const slides = await prisma.lectureSlide.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                title: true,
                description: true,
                embedUrl: true,
                fileUrl: true,
                contentType: true,
                order: true,
                category: true,
                courseId: true,
                isPreview: true,
                createdAt: true,
                updatedAt: true,
                course: {
                    select: {
                        id: true,
                        title: true,
                        code: true,
                    },
                },
                creator: {
                    select: { name: true },
                },
            },
        });

        return NextResponse.json(slides);
    } catch (error: any) {
        console.error('[lecture-slides GET] Error:', error);
        console.error('[lecture-slides GET] Error details:', {
            message: error?.message,
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
        });
        return NextResponse.json(
            {
                error: 'Failed to fetch lecture slides',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
            },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await getAuthUser(['TUTOR', 'LECTURER', 'ADMIN', 'SUPER_ADMIN']);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        const {
            title,
            description,
            embedUrl,
            fileUrl,
            contentType,
            order,
            category,
            courseId,
        } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        if (!courseId) {
            return NextResponse.json({ error: 'Course is required' }, { status: 400 });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, year: true, period: true, tutorId: true, createdBy: true, programme: { select: { institutionId: true } } },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // SECURITY: Verify the user is authorized for this course (scope + assignment)
        if (!await isUserAuthorizedForCourse(auth.user, course)) {
            return NextResponse.json(
                { error: 'You are not authorized to upload to this course' },
                { status: 403 }
            );
        }

        const slide = await prisma.lectureSlide.create({
            data: {
                title,
                description: description || null,
                embedUrl: embedUrl || null,
                fileUrl: fileUrl || null,
                contentType: contentType || null,
                order: order ? parseInt(String(order)) : 0,
                category: category || null,
                courseId,
                createdBy: auth.userId,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        programme: {
                            select: {
                                id: true,
                                name: true,
                                institution: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(slide, { status: 201 });
    } catch (error: any) {
        console.error('[lecture-slides POST] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create lecture slide' },
            { status: 500 }
        );
    }
}