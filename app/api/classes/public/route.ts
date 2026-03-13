import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

export async function GET() {
  try {
    const classes = await db.class.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("GET_PUBLIC_CLASSES_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}
