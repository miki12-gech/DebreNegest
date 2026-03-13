import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify user is a member of this conversation
    const membership = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: session.user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, fullName: true, name: true, image: true },
        },
        reads: {
          select: { userId: true, readAt: true },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET_MESSAGES_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify user is a member of this conversation
    const postMembership = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: session.user.id } },
    });
    if (!postMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { content, image } = body;

    if (!content && !image) {
      return NextResponse.json({ error: "Content or image is required" }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        content: content || "",
        image,
        conversationId,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, name: true, image: true },
        },
        reads: {
          select: { userId: true, readAt: true },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("CREATE_MESSAGE_ERROR", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
