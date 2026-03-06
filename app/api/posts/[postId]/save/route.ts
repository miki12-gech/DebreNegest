import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const existingSave = await db.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existingSave) {
      await db.savedPost.delete({
        where: { id: existingSave.id },
      });
      return NextResponse.json({ saved: false });
    }

    await db.savedPost.create({
      data: {
        userId: session.user.id,
        postId,
      },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("SAVE_POST_ERROR", error);
    return NextResponse.json({ error: "Failed to toggle save" }, { status: 500 });
  }
}
