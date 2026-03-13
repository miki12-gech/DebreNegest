import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== "SUPER_ADMIN" && userRole !== "CLASS_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
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
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET_CLASS_MEMBERS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch class members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== "SUPER_ADMIN" && userRole !== "CLASS_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, classId } = body;

    if (!userId || !classId) {
      return NextResponse.json({ error: "User ID and Class ID are required" }, { status: 400 });
    }

    const existing = await db.classMember.findFirst({
      where: { userId, classId },
    });

    if (existing) {
      return NextResponse.json({ error: "User is already a member of this class" }, { status: 400 });
    }

    const member = await db.classMember.create({
      data: { userId, classId },
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
    return NextResponse.json({ error: "Failed to add class member" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== "SUPER_ADMIN" && userRole !== "CLASS_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    await db.classMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("REMOVE_CLASS_MEMBER_ERROR", error);
    return NextResponse.json({ error: "Failed to remove class member" }, { status: 500 });
  }
}
