import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, classId } = body;

    if (!userId || !classId) {
      return NextResponse.json({ error: "User ID and Class ID are required" }, { status: 400 });
    }

    const existing = await db.classAdmin.findFirst({
      where: { userId, classId },
    });

    if (existing) {
      return NextResponse.json({ error: "User is already a leader of this class" }, { status: 400 });
    }

    await db.classAdmin.create({
      data: { userId, classId },
    });

    // Also update user role to CLASS_ADMIN if they are currently MEMBER
    await db.user.update({
      where: { id: userId },
      data: { role: "CLASS_ADMIN" },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("ASSIGN_CLASS_LEADER_ERROR", error);
    return NextResponse.json({ error: "Failed to assign class leader" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const classId = searchParams.get("classId");

    if (!userId || !classId) {
      return NextResponse.json({ error: "User ID and Class ID are required" }, { status: 400 });
    }

    await db.classAdmin.deleteMany({
      where: { userId, classId },
    });

    // Check if the user still administers any other classes
    const otherAdminRoles = await db.classAdmin.count({
      where: { userId },
    });

    // If no more class admin roles, revert to MEMBER
    if (otherAdminRoles === 0) {
      await db.user.update({
        where: { id: userId },
        data: { role: "MEMBER" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("REMOVE_CLASS_LEADER_ERROR", error);
    return NextResponse.json({ error: "Failed to remove class leader" }, { status: 500 });
  }
}
