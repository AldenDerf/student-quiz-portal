"use server";

import { prisma } from "@/prisma/db";

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
