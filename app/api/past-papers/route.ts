import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { buildCourseResourceScopeWhereFromUser, isUserAuthorizedForCourse } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);

        const category = searchParams.get('category');
        const courseCode = searchParams.get('courseCode');
        const courseId = searchParams.get('courseId');
        const year = searchParams.get('year');

        const institutionId =
            searchParams.get('institutionId') || searchParams.get('institution');

        const universityId =
            searchParams.get('universityId') || searchParams.get('university');

        const where: any = {};

        if (category) where.category = category;
        if (courseCode) where.courseCode = courseCode;
        if (courseId) where.courseId = courseId;
        if (year) where.year = parseInt(year);

        if (institutionId) {
            where.course = {
                ...where.course,
                programme: {
                    institutionId,
                },
            };
        } else if (universityId) {
            where.course = {
                ...where.course,
                programme: { institutionId: universityId },
            };
        }

        // SECURITY: Filter by user's academic scope (university, year, period)
        const scopeWhere = buildCourseResourceScopeWhereFromUser(auth.user);
        if (scopeWhere.course) {
            where.course = { ...where.course, ...scopeWhere.course };
        }

        const papers = await prisma.pastPaper.findMany({
            where,
            include: {
                creator: {
                    select: { name: true, email: true },
                },
                course: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        programme: {
                            select: {
                                id: true,
                                name: true,
                                institutionId: true,
                                institution: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                        shortName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(papers);
    } catch (error) {
        console.error('[past-papers GET] Error:', error);
        return NextResponse.json([]);
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
            courseCode,
            courseId,
            year,
            semester,
            category,
            fileUrl,
            fileType,
            fileSize,
        } = body;

        if (!title || !fileUrl) {
            return NextResponse.json(
                { error: 'Title and file URL are required' },
                { status: 400 }
            );
        }

        if (!courseId) {
            return NextResponse.json(
                { error: 'Course is required' },
                { status: 400 }
            );
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                code: true,
                year: true,
                period: true,
                tutorId: true,
                createdBy: true,
                programme: { select: { institutionId: true } },
            },
        });

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        // SECURITY: Verify the user is authorized for this course (scope + assignment)
        if (!await isUserAuthorizedForCourse(auth.user, course)) {
            return NextResponse.json(
                { error: 'You are not authorized to upload to this course' },
                { status: 403 }
            );
        }

        const paper = await prisma.pastPaper.create({
            data: {
                title,
                description: description || null,
                courseCode: courseCode || course.code || null,
                courseId,
                year: year ? parseInt(String(year)) : null,
                semester: semester || null,
                category: category || 'final_exam',
                fileUrl,
                fileType: fileType || null,
                fileSize: fileSize ? parseInt(String(fileSize)) : null,
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

        return NextResponse.json(paper, { status: 201 });
    } catch (error: any) {
        console.error('[past-papers POST] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create past paper' },
            { status: 500 }
        );
    }
}