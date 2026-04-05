"use server";

import { prisma } from "@/prisma/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullname: z.string().min(1, "Fullname is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUser(formData: any) {
  try {
    const parsedData = registerSchema.safeParse(formData);

    if (!parsedData.success) {
      return {
        success: false,
        error: parsedData.error.issues[0].message,
      };
    }

    const { username, fullname, email, password } = parsedData.data;

    // Verify user doesn't already exist
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: "User with that email or username already exists.",
      };
    }

    // Hash the password securely
    const password_hash = await bcrypt.hash(password, 10);

    // Insert the User into the database
    await prisma.user.create({
      data: {
        username,
        fullname,
        email,
        password_hash,
        role: "exam_creator",
        is_active: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Registration Action Error:", error);
    return {
      success: false,
      error: "Internal Server Error during registration",
    };
  }
}
