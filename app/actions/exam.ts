"use server";

import { prisma } from "@/prisma/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function uploadExam(
  examName: string,
  subjectId: number,
  questions: any[],
) {
  const session = await auth();
  if (
    !session ||
    !session.user ||
    (session.user.role !== "admin" && session.user.role !== "exam_creator")
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const creatorId = parseInt(session.user.id);

  try {
    // Calculate total marks
    const totalMarks = questions.reduce(
      (sum: number, q: any) => sum + (q.marks || 1),
      0,
    );

    // Create Exam
    const exam = await prisma.exam.create({
      data: {
        exam_name: examName,
        subject_id: subjectId,
        creator_id: creatorId,
        total_marks: totalMarks,
        questions: {
          create: questions.map((q: any, qIdx: number) => ({
            question_text: q.text,
            marks: q.marks || 1,
            order_index: qIdx,
            options: {
              create: q.options.map((opt: any) => ({
                option_text: opt.text,
                is_correct: opt.is_correct,
              })),
            },
          })),
        },
      },
    });

    revalidatePath("/dashboard/exams");
    return { success: true, examId: exam.id };
  } catch (error: any) {
    console.error("[UploadExam] Error:", error);
    return { success: false, error: error.message || "Failed to upload exam" };
  }
}

export async function getExams() {
  return await prisma.exam.findMany({
    include: {
      subject: true,
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { id: "desc" },
  });
}

export async function deleteExam(id: number) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.exam.delete({ where: { id } });
  revalidatePath("/dashboard/exams");
  return { success: true };
}


export async function submitExam(
  studentId: number,
  examId: number,
  selections: Record<number, number>,
) {
  const startTime = Date.now();
  try {
    console.log(`[ExamSubmit] Start: Student ${studentId}, Exam ${examId}`);

    // 1. Fetch exam metadata and all questions with only correct options
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            options: {
              where: { is_correct: true },
            },
          },
        },
      },
    });

    if (!exam) {
      console.error(`[ExamSubmit] Error: Exam ${examId} not found`);
      return { success: false, error: "Exam not found." };
    }
    const fetchTime = Date.now();
    console.log(`[ExamSubmit] Exam fetched in ${fetchTime - startTime}ms`);

    let score = 0;
    let totalMarks = 0;

    for (const q of exam.questions) {
      totalMarks += q.marks;

      const selectedOptionId = selections[q.id];
      if (!selectedOptionId) continue;

      const correctOption = q.options[0]; // Since we filtered by is_correct: true
      if (correctOption && correctOption.id === selectedOptionId) {
        score += q.marks;
      }
    }

    const calculatedPercentage =
      totalMarks > 0 ? parseFloat(((score / totalMarks) * 100).toFixed(2)) : 0;

    // 2. Count previous attempts
    const previousAttempts = await prisma.examResult.count({
      where: {
        student_id: studentId,
        exam_id: examId,
      },
    });
    const countTime = Date.now();
    console.log(
      `[ExamSubmit] Previous attempts (${previousAttempts}) counted in ${countTime - fetchTime}ms`,
    );

    if (previousAttempts >= 2) {
      console.warn(
        `[ExamSubmit] Blocked: Max attempts reached for Student ${studentId}`,
      );
      return {
        success: false,
        error:
          "Maximum attempts reached. You can only take this exam twice (1 original + 1 retake).",
      };
    }

    const isRetake = previousAttempts === 1;
    let finalPercentage = calculatedPercentage;

    if (isRetake) {
      finalPercentage = parseFloat((calculatedPercentage * 0.95).toFixed(2));
    }

    // 3. Create Result
    const newResult = await prisma.examResult.create({
      data: {
        student_id: studentId,
        exam_id: examId,
        score,
        percentage: finalPercentage,
      },
    });
    const saveTime = Date.now();
    console.log(
      `[ExamSubmit] Result saved in ${saveTime - countTime}ms. Total: ${saveTime - startTime}ms`,
    );

    return { success: true, resultId: newResult.id };
  } catch (error: any) {
    console.error(`[ExamSubmit] CRITICAL ERROR:`, error);
    return {
      success: false,
      error: "Internal Server Error during exam processing.",
    };
  }
}
