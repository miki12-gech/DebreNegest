"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/prisma";

const RegisterSchema = z.object({
    fullName: z.string().min(1, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Minimum 6 characters required" }),
    image: z.string().optional(),
});

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password, fullName, image } = validatedFields.data;

    try {
        const existingUser = await db.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return { error: "Email already in use!" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.user.create({
            data: {
                fullName,
                name: fullName, // NextAuth sometimes expects `name`
                email,
                password: hashedPassword,
                image: image || null,
                // Role defaults to MEMBER in Prisma Schema
            },
        });

        return { success: "Account created successfully!" };
    } catch (error) {
        console.error("REGISTRATION_ERROR", error);
        return { error: "Something went wrong!" };
    }
};
