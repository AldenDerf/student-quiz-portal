import { NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    console.log("[Seed API] Starting seed process...");

    // Create Admin User
    const adminPassword = "admin";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
      where: { email: "teacher@quiz.com" },
      update: {
        password_hash: hashedPassword,
        is_active: true,
      },
      create: {
        email: "teacher@quiz.com",
        fullname: "Admin Teacher",
        password_hash: hashedPassword,
        role: "exam_creator",
        is_active: true,
      },
    });

    console.log("[Seed API] Admin user upserted:", admin.email);

    // Create a Test Student
    const student = await prisma.student.upsert({
      where: { student_num: "2024-001" },
      update: {},
      create: {
        student_num: "2024-001",
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
      },
    });

    console.log("[Seed API] Student upserted:", student.student_num);

    // Create a Subject
    const subject = await prisma.subject.upsert({
      where: { subject_code: "CSS-101" },
      update: {},
      create: {
        subject_code: "CSS-101",
        subject_name: "Advanced CSS Layouts",
      },
    });

    console.log("[Seed API] Subject upserted:", subject.subject_code);

    // Create a Term
    const term = await prisma.academicTerm.upsert({
      where: { id: 1 }, // Simplistic for seed
      update: {},
      create: {
        id: 1,
        school_year: "2025-2026",
        semester: "First Semester",
      },
    });

    console.log("[Seed API] Term upserted:", term.school_year);

    // Create an Enrollment
    await prisma.enrollment.create({
      data: {
        student_id: student.id,
        subject_id: subject.id,
        term_id: term.id,
      },
    });

    console.log("[Seed API] Seed completed successfully!");

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      admin: admin.email,
      student: student.student_num,
    });
  } catch (error: any) {
    console.error("[Seed API] Seed failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
