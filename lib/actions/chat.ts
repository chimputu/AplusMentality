'use server';

// Chat persistence server actions — all require authentication
// Ensures users can only access their own conversations
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ── Auth helper ──
async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');
  return user;
}

// ── List conversations ──
export async function listConversations(options?: {
  archived?: boolean;
  limit?: number;
}) {
  const user = await requireUser();
  return prisma.chatConversation.findMany({
    where: {
      userId: user.id,
      isArchived: options?.archived ?? false,
    },
    orderBy: { lastMessageAt: 'desc' },
    take: options?.limit ?? 20,
    include: {
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
    },
  });
}

// ── Get a conversation with all messages ──
export async function getConversation(id: string) {
  const user = await requireUser();
  const conversation = await prisma.chatConversation.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!conversation) throw new Error('Conversation not found');
  return conversation;
}

// ── Create a new conversation ──
export async function createConversation(input?: {
  title?: string;
  mode?: 'PUBLIC' | 'LOGGED_IN';
}) {
  const user = await requireUser();
  return prisma.chatConversation.create({
    data: {
      userId: user.id,
      title: input?.title ?? 'New conversation',
      mode: input?.mode ?? 'LOGGED_IN',
    },
  });
}

// ── Append messages to a conversation ──
const appendSchema = z.object({
  conversationId: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(10000),
      isError: z.boolean().optional(),
      tokensUsed: z.number().int().optional(),
    })
  ),
  title: z.string().optional(),
});

export async function appendMessages(
  input: z.infer<typeof appendSchema>
) {
  const user = await requireUser();
  const data = appendSchema.parse(input);

  // Verify ownership
  const conversation = await prisma.chatConversation.findFirst({
    where: { id: data.conversationId, userId: user.id },
  });
  if (!conversation) throw new Error('Conversation not found');

  // Insert messages and bump lastMessageAt
  await prisma.$transaction([
    prisma.chatMessage.createMany({
      data: data.messages.map((m) => ({
        conversationId: data.conversationId,
        role: m.role,
        content: m.content,
        isError: m.isError ?? false,
        tokensUsed: m.tokensUsed,
      })),
    }),
    prisma.chatConversation.update({
      where: { id: data.conversationId },
      data: {
        lastMessageAt: new Date(),
        // Auto-title on first user message if still default
        ...(data.title &&
          conversation.title === 'New conversation' && {
            title: data.title.slice(0, 60),
          }),
      },
    }),
  ]);

  revalidatePath('/assistant');
  return { success: true };
}

// ── Rename ──
export async function renameConversation(id: string, title: string) {
  const user = await requireUser();
  await prisma.chatConversation.updateMany({
    where: { id, userId: user.id },
    data: { title: title.slice(0, 60) },
  });
  revalidatePath('/assistant');
  return { success: true };
}

// ── Archive ──
export async function archiveConversation(id: string) {
  const user = await requireUser();
  await prisma.chatConversation.updateMany({
    where: { id, userId: user.id },
    data: { isArchived: true },
  });
  revalidatePath('/assistant');
  return { success: true };
}

// ── Delete ──
export async function deleteConversation(id: string) {
  const user = await requireUser();
  await prisma.chatConversation.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath('/assistant');
  return { success: true };
}

// ── Delete all (clear chat) ──
export async function deleteAllConversations() {
  const user = await requireUser();
  await prisma.chatConversation.deleteMany({
    where: { userId: user.id },
  });
  revalidatePath('/assistant');
  return { success: true };
}
