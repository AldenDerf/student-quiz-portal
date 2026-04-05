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

    // Basic heuristic feedback. In production, an AI service like OpenAI/Gemini would evaluate this.
    let aiFeedback =
      "Solid basic effort! Keep practicing your CSS fundamentals.";
    if (percentage >= 90) {
      aiFeedback =
        "Incredible work! You have a profound mastery of these CSS concepts. Your understanding of layouts and selectors is strictly professional production level.";
    } else if (percentage >= 70) {
      aiFeedback =
        "Great job! You have a solid grasp on CSS, though reviewing some advanced layout modules like Grid and Box Model nuances might help push you to perfection.";
    } else if (percentage < 50) {
      aiFeedback =
        "You seem to be struggling with the foundational CSS properties. I recommend revisiting the core Box Model and Flexbox tutorials before taking advanced tests.";
    }

    // Upsert or Create Result
    const newResult = await prisma.examResult.create({
      data: {
        student_id: studentId,
        exam_id: examId,
        score,
        percentage,
        ai_feedback: aiFeedback,
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
