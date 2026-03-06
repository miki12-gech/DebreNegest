import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        _count: {
          select: { posts: true, comments: true, likes: true },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET_PROFILE_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, image, currentPassword, newPassword } = body;

    const updateData: Record<string, string> = {};

    if (fullName) {
      updateData.fullName = fullName;
      updateData.name = fullName;
    }
    if (image !== undefined) {
      updateData.image = image;
    }

    if (currentPassword && newPassword) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user?.password) {
        return NextResponse.json({ error: "Cannot change password for OAuth accounts" }, { status: 400 });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
