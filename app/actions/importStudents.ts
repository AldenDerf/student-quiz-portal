"use server";

import { prisma } from "@/prisma/db";
import { auth } from "@/auth";

type StudentRow = {
  student_num: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  gender?: "Male" | "Female" | "Other";
  email: string;
  section?: string; // e.g. "A", "B"
};

export async function importStudentsAction(
  rows: StudentRow[],
  subjectCode: string,
  schoolYear: string,
  semester: string,
) {
  const session = await auth();

  // Guard: only admin can import
  if (!session?.user || session.user.role !== "admin") {
    return {
      success: false,
      error: "Unauthorized. Only admins can import students.",
    };
  }

  if (!rows.length) {
    return { success: false, error: "No student rows provided." };
  }

  try {
    // 1. Get or create the subject
    const subject = await prisma.subject.findUnique({
      where: { subject_code: subjectCode },
    });
    if (!subject) {
      return {
        success: false,
        error: `Subject with code "${subjectCode}" does not exist. Please create it first.`,
      };
    }

    // 2. Get or create the academic term
    let term = await prisma.academicTerm.findFirst({
      where: { school_year: schoolYear, semester },
    });
    if (!term) {
      term = await prisma.academicTerm.create({
        data: { school_year: schoolYear, semester },
      });
    }

    let created = 0;
    let updated = 0;
    let enrolled = 0;
    let alreadyEnrolled = 0;

    // Normalize gender string to match Prisma enum (Male | Female | Other)
    const normalizeGender = (
      g?: string,
    ): "Male" | "Female" | "Other" | null => {
      if (!g) return null;
      const lower = g.trim().toLowerCase();
      if (lower === "male" || lower === "m") return "Male";
      if (lower === "female" || lower === "f") return "Female";
      return "Other";
    };

    for (const row of rows) {
      // 3. Upsert student — no duplicates by student_num
      const student = await prisma.student.upsert({
        where: { student_num: row.student_num },
        update: {
          firstname: row.firstname,
          middlename: row.middlename || null,
          lastname: row.lastname,
          gender: normalizeGender(row.gender),
          email: row.email,
        },
        create: {
          student_num: row.student_num,
          firstname: row.firstname,
          middlename: row.middlename || null,
          lastname: row.lastname,
          gender: normalizeGender(row.gender),
          email: row.email,
        },
      });

      if (student) {
        // Track if already existed or newly created
        const existing = await prisma.student.findFirst({
          where: { student_num: row.student_num, id: { not: student.id } },
        });
        if (existing) updated++;
        else created++;
      }

      // 4. Check existing enrollment to avoid duplicate
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          student_id: student.id,
          subject_id: subject.id,
          term_id: term.id,
        },
      });

      // If already enrolled but section changed, update it
      if (
        existingEnrollment &&
        row.section &&
        existingEnrollment.section !== row.section
      ) {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { section: row.section },
        });
      }

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            student_id: student.id,
            subject_id: subject.id,
            term_id: term.id,
            section: row.section || null,
          },
        });
        enrolled++;
      } else {
        alreadyEnrolled++;
      }
    }

    return {
      success: true,
      summary: {
        total: rows.length,
        created,
        updated,
        enrolled,
        alreadyEnrolled,
      },
    };
  } catch (error: any) {
    console.error("Import failed:", error);
    return {
      success: false,
      error: error.message || "Import failed due to a server error.",
    };
  }
}
