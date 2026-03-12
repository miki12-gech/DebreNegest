import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10");
    const classId = searchParams.get("classId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (classId) {
      where.classId = classId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const posts = await db.post.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          select: { id: true, fullName: true, name: true, image: true, role: true },
        },
        class: { select: { id: true, name: true } },
        _count: { select: { comments: true, likes: true } },
        likes: {
          select: { userId: true },
        },
        saves: {
          select: { userId: true },
        },
      },
    });

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({ posts, nextCursor });
  } catch (error) {
    console.error("GET_POSTS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, image, classId, isGlobal, isPinned } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Only SUPER_ADMIN can create global or pinned posts
    if ((isGlobal || isPinned) && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // CLASS_ADMIN can only post to their own class
    if (session.user.role === "CLASS_ADMIN" && classId) {
      const isAdminOfClass = await db.classAdmin.findUnique({
        where: {
          userId_classId: {
            userId: session.user.id,
            classId,
          },
        },
      });

      if (!isAdminOfClass) {
        return NextResponse.json(
          { error: "You can only post to your own class" },
          { status: 403 }
        );
      }
    }

    // If CLASS_ADMIN posts without classId, auto-assign to their class
    let resolvedClassId = classId || null;
    if (session.user.role === "CLASS_ADMIN" && !classId) {
      const adminClass = await db.classAdmin.findFirst({
        where: { userId: session.user.id },
      });
      if (adminClass) {
        resolvedClassId = adminClass.classId;
      }
    }

    const post = await db.post.create({
      data: {
        title,
        content,
        image,
        classId: resolvedClassId,
        isGlobal: isGlobal || false,
        isPinned: isPinned || false,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, fullName: true, name: true, image: true, role: true },
        },
        class: { select: { id: true, name: true } },
        _count: { select: { comments: true, likes: true } },
        likes: { select: { userId: true } },
        saves: { select: { userId: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("CREATE_POST_ERROR", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
