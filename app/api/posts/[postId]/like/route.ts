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
    const existingLike = await db.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existingLike) {
      await db.like.delete({
        where: { id: existingLike.id },
      });
      return NextResponse.json({ liked: false });
    }

    await db.like.create({
      data: {
        userId: session.user.id,
        postId,
      },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("LIKE_POST_ERROR", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
