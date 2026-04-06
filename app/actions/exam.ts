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

    const percentage =
      totalMarks > 0 ? parseFloat(((score / totalMarks) * 100).toFixed(2)) : 0;

    // Upsert or Create Result
    const newResult = await prisma.examResult.create({
      data: {
        student_id: studentId,
        exam_id: examId,
        score,
        percentage,
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
