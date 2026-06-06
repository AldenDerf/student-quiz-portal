"use server";

import { prisma } from "@/prisma/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Verification Guard Helper
async function checkAuthorized() {
  const session = await auth();
  if (
    !session ||
    !session.user ||
    (session.user.role !== "admin" && session.user.role !== "exam_creator")
  ) {
    throw new Error("Unauthorized. Only admins and teachers can manage student records.");
  }
}

export async function addStudentAction(data: {
  studentNum: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  gender?: "Male" | "Female" | "Other";
  email: string;
  subjectCode: string;
  section?: string;
}) {
  try {
    await checkAuthorized();

    const { studentNum, firstname, middlename, lastname, gender, email, subjectCode, section } = data;

    // 1. Get Subject
    const subject = await prisma.subject.findUnique({
      where: { subject_code: subjectCode },
    });
    if (!subject) {
      return { success: false, error: `Subject code "${subjectCode}" not found.` };
    }

    // 2. Get or create a default Academic Term
    let term = await prisma.academicTerm.findFirst({
      orderBy: { id: "desc" }
    });
    if (!term) {
      term = await prisma.academicTerm.create({
        data: {
          school_year: "2025-2026",
          semester: "First Semester",
        }
      });
    }

    // 3. Create or Update Student
    const student = await prisma.student.upsert({
      where: { student_num: studentNum },
      update: {
        firstname,
        middlename: middlename || null,
        lastname,
        gender: gender || null,
        email,
      },
      create: {
        student_num: studentNum,
        firstname,
        middlename: middlename || null,
        lastname,
        gender: gender || null,
        email,
      },
    });

    // 4. Enroll Student in the Subject (or update section if already enrolled)
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        student_id: student.id,
        subject_id: subject.id,
      },
    });

    if (existingEnrollment) {
      await prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: {
          section: section || null,
          term_id: term.id, // Update term if needed
        },
      });
    } else {
      await prisma.enrollment.create({
        data: {
          student_id: student.id,
          subject_id: subject.id,
          term_id: term.id,
          section: section || null,
        },
      });
    }

    revalidatePath("/dashboard/students");
    return { success: true, studentId: student.id };
  } catch (error: any) {
    console.error("[AddStudentAction] Error:", error);
    return { success: false, error: error.message || "Failed to add student." };
  }
}

export async function updateStudentAction(
  studentId: number,
  data: {
    studentNum: string;
    firstname: string;
    middlename?: string;
    lastname: string;
    gender?: "Male" | "Female" | "Other";
    email: string;
    subjectCode: string;
    section?: string;
  }
) {
  try {
    await checkAuthorized();

    const { studentNum, firstname, middlename, lastname, gender, email, subjectCode, section } = data;

    // 1. Update Student Basic Info
    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        student_num: studentNum,
        firstname,
        middlename: middlename || null,
        lastname,
        gender: gender || null,
        email,
      },
    });

    // 2. Update Enrollment Details for this Subject
    const subject = await prisma.subject.findUnique({
      where: { subject_code: subjectCode },
    });
    if (subject) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          student_id: studentId,
          subject_id: subject.id,
        },
      });

      if (enrollment) {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { section: section || null },
        });
      } else {
        // Enforce term
        let term = await prisma.academicTerm.findFirst({
          orderBy: { id: "desc" },
        });
        if (!term) {
          term = await prisma.academicTerm.create({
            data: { school_year: "2025-2026", semester: "First Semester" },
          });
        }
        await prisma.enrollment.create({
          data: {
            student_id: studentId,
            subject_id: subject.id,
            term_id: term.id,
            section: section || null,
          },
        });
      }
    }

    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (error: any) {
    console.error("[UpdateStudentAction] Error:", error);
    return { success: false, error: error.message || "Failed to update student details." };
  }
}

export async function deleteStudentAction(studentId: number, confirmStudentNum: string) {
  try {
    await checkAuthorized();

    // 1. Verify Student Number matches before deletion
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { success: false, error: "Student record not found." };
    }

    if (student.student_num !== confirmStudentNum) {
      return { success: false, error: "Verification failed. Student ID does not match." };
    }

    // 2. Perform Cascade Delete
    // (enrollments, exam_results, quiz_results, quiz_responses cascade deleted automatically)
    await prisma.student.delete({
      where: { id: studentId },
    });

    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (error: any) {
    console.error("[DeleteStudentAction] Error:", error);
    return { success: false, error: error.message || "Failed to delete student." };
  }
}
