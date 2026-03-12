import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

// Get members of a class (accessible by super admin or class admin of that class)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Check permissions: super admin or class admin of this class
    if (session.user.role !== "SUPER_ADMIN") {
      const isClassAdmin = await db.classAdmin.findUnique({
        where: {
          userId_classId: {
            userId: session.user.id,
            classId,
          },
        },
      });

      if (!isClassAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const members = await db.classMember.findMany({
      where: { classId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            _count: { select: { posts: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET_CLASS_MEMBERS_ERROR", error);
    return NextResponse.json(
      { error: "Failed to fetch class members" },
      { status: 500 }
    );
  }
}

// Add a member to a class
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId: directUserId, email, classId } = body;

    // Support both userId and email-based lookup
    let userId = directUserId;
    if (!userId && email) {
      const userByEmail = await db.user.findUnique({ where: { email } });
      if (!userByEmail) {
        return NextResponse.json({ error: "User not found with that email" }, { status: 404 });
      }
      userId = userByEmail.id;
    }

    if (!userId || !classId) {
      return NextResponse.json(
        { error: "User ID (or email) and Class ID are required" },
        { status: 400 }
      );
    }

    // Check permissions
    if (session.user.role !== "SUPER_ADMIN") {
      const isClassAdmin = await db.classAdmin.findUnique({
        where: {
          userId_classId: {
            userId: session.user.id,
            classId,
          },
        },
      });

      if (!isClassAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const member = await db.classMember.upsert({
      where: {
        userId_classId: { userId, classId },
      },
      update: {},
      create: { userId, classId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("ADD_CLASS_MEMBER_ERROR", error);
    return NextResponse.json(
      { error: "Failed to add class member" },
      { status: 500 }
    );
  }
}

// Remove a member from a class
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const classId = searchParams.get("classId");

    if (!userId || !classId) {
      return NextResponse.json(
        { error: "User ID and Class ID are required" },
        { status: 400 }
      );
    }

    // Check permissions
    if (session.user.role !== "SUPER_ADMIN") {
      const isClassAdmin = await db.classAdmin.findUnique({
        where: {
          userId_classId: {
            userId: session.user.id,
            classId,
          },
        },
      });

      if (!isClassAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    await db.classMember.deleteMany({
      where: { userId, classId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("REMOVE_CLASS_MEMBER_ERROR", error);
    return NextResponse.json(
      { error: "Failed to remove class member" },
      { status: 500 }
    );
  }
}
