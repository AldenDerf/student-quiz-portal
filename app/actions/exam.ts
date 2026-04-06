"use server";

import { prisma } from "@/prisma/db";

export async function submitExam(
  studentId: number,
  examId: number,
  selections: Record<number, number>,
) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!exam) {
      return { success: false, error: "Exam not found." };
    }

    let score = 0;
    let totalMarks = 0;

    for (const q of exam.questions) {
      totalMarks += q.marks;

      const selectedOptionId = selections[q.id];
      if (!selectedOptionId) continue; // Skipped question

      const option = q.options.find((o) => o.id === selectedOptionId);
      if (option?.is_correct) {
        score += q.marks;
      }
    }

    const calculatedPercentage =
      totalMarks > 0 ? parseFloat(((score / totalMarks) * 100).toFixed(2)) : 0;

    // Check if this is a retake or if they've exceeded the limit
    const previousAttempts = await prisma.examResult.count({
      where: {
        student_id: studentId,
        exam_id: examId,
      },
    });

    if (previousAttempts >= 2) {
      return {
        success: false,
        error:
          "Maximum attempts reached. You can only take this exam twice (1 original + 1 retake).",
      };
    }

    const isRetake = previousAttempts === 1;
    let finalPercentage = calculatedPercentage;

    if (isRetake) {
      // Multiply by 0.95 to make the highest possible score 95% for retakes
      finalPercentage = parseFloat((calculatedPercentage * 0.95).toFixed(2));
    }

    // Upsert or Create Result
    const newResult = await prisma.examResult.create({
      data: {
        student_id: studentId,
        exam_id: examId,
        score,
        percentage: finalPercentage,
      },
    });

    return { success: true, resultId: newResult.id };
  } catch (error: any) {
    console.error("Exam submission failed:", error);
    return {
      success: false,
      error: "Internal Server Error during exam processing.",
    };
  }
}
