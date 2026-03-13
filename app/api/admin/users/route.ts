import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        name: true,
        email: true,
        image: true,
        role: true,
        classId: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true } },
        classesAdministered: {
          select: {
            classId: true,
            class: { select: { id: true, name: true } },
          },
        },
        classMemberships: {
          select: {
            classId: true,
            class: { select: { id: true, name: true } },
          },
        },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET_USERS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 });
    }

    if (!["SUPER_ADMIN", "CLASS_ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        fullName: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("UPDATE_USER_ROLE_ERROR", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
