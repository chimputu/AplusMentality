import { prisma } from './prisma';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  description: string,
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        description,
        isRead: false,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function createNotificationsForAllStudents(
  type: string,
  title: string,
  description: string,
) {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, clerkId: true },
    });

    const notifications = students.map((student) => ({
      userId: student.clerkId,
      type,
      title,
      description,
      isRead: false,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }
  } catch (error) {
    console.error('Failed to create notifications for students:', error);
  }
}
