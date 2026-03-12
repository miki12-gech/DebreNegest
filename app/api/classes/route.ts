import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const classes = await db.class.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { posts: true, admins: true, members: true } },
        admins: {
          include: {
            user: {
              select: { id: true, fullName: true, name: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("GET_CLASSES_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newClass = await db.class.create({
      data: { name, description },
      include: {
        _count: { select: { posts: true, admins: true } },
        admins: {
          include: {
            user: {
              select: { id: true, fullName: true, name: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("CREATE_CLASS_ERROR", error);
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}
