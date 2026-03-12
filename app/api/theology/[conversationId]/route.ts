import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    const conversation = await db.theologyConversation.findUnique({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(conversation.messages);
  } catch (error) {
    console.error("GET_THEOLOGY_CONVERSATION_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load conversation messages" },
      { status: 500 }
    );
  }
}
