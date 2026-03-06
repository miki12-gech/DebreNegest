import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await db.conversation.findMany({
      where: {
        members: {
          some: { userId: session.user.id },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, name: true, image: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: { id: true, fullName: true, name: true },
            },
          },
        },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("GET_CONVERSATIONS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, type } = body;

    if (type === "PRIVATE" && userId) {
      // Check if conversation already exists between these two users
      const existingConversation = await db.conversation.findFirst({
        where: {
          type: "PRIVATE",
          AND: [
            { members: { some: { userId: session.user.id } } },
            { members: { some: { userId } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, fullName: true, name: true, image: true },
              },
            },
          },
        },
      });

      if (existingConversation) {
        return NextResponse.json(existingConversation);
      }

      const conversation = await db.conversation.create({
        data: {
          type: "PRIVATE",
          members: {
            create: [
              { userId: session.user.id },
              { userId },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, fullName: true, name: true, image: true },
              },
            },
          },
        },
      });

      return NextResponse.json(conversation, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("CREATE_CONVERSATION_ERROR", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
