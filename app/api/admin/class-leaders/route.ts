import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

// Assign a user as class leader for a specific class
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, classId } = body;

    if (!userId || !classId) {
      return NextResponse.json(
        { error: "User ID and Class ID are required" },
        { status: 400 }
      );
    }

    // Update user role to CLASS_ADMIN
    await db.user.update({
      where: { id: userId },
      data: { role: "CLASS_ADMIN" },
    });

    // Create ClassAdmin entry (upsert to avoid duplicates)
    await db.classAdmin.upsert({
      where: {
        userId_classId: { userId, classId },
      },
      update: {},
      create: { userId, classId },
    });

    // Also ensure they are a member of the class
    await db.classMember.upsert({
      where: {
        userId_classId: { userId, classId },
      },
      update: {},
      create: { userId, classId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ASSIGN_CLASS_LEADER_ERROR", error);
    return NextResponse.json(
      { error: "Failed to assign class leader" },
      { status: 500 }
    );
  }
}

// Remove a class leader
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
      return NextResponse.json(
        { error: "User ID and Class ID are required" },
        { status: 400 }
      );
    }

    // Remove ClassAdmin entry
    await db.classAdmin.deleteMany({
      where: { userId, classId },
    });

    // Check if user still administers any other class
    const remainingAdminRoles = await db.classAdmin.count({
      where: { userId },
    });

    // If no more admin roles, demote to MEMBER
    if (remainingAdminRoles === 0) {
      await db.user.update({
        where: { id: userId },
        data: { role: "MEMBER" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("REMOVE_CLASS_LEADER_ERROR", error);
    return NextResponse.json(
      { error: "Failed to remove class leader" },
      { status: 500 }
    );
  }
}
