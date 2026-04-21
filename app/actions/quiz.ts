"use server";

import { prisma } from "@/prisma/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function uploadQuiz(
  quizName: string,
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

    // Create Quiz
    const quiz = await prisma.quiz.create({
      data: {
        quiz_name: quizName,
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

    revalidatePath("/admin/quizzes");
    return { success: true, quizId: quiz.id };
  } catch (error: any) {
    console.error("[UploadQuiz] Error:", error);
    return { success: false, error: error.message || "Failed to upload quiz" };
  }
}

export async function getSubjects() {
  return await prisma.subject.findMany({
    orderBy: { subject_code: "asc" },
  });
}

export async function submitQuiz(
  studentId: number,
  quizId: number,
  selections: Record<number, number>,
) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found" };
    }

    let score = 0;
    const responseData = [];

    for (const q of quiz.questions) {
      const selectedOptionId = selections[q.id];
      const correctOption = q.options.find((opt) => opt.is_correct);
      const isCorrect = !!(
        selectedOptionId &&
        correctOption &&
        selectedOptionId === correctOption.id
      );

      if (isCorrect) {
        score += q.marks;
      }

      if (selectedOptionId) {
        responseData.push({
          question_id: q.id,
          selected_option_id: selectedOptionId,
          is_correct: isCorrect,
        });
      }
    }

    const percentage =
      quiz.total_marks > 0 ? (score / quiz.total_marks) * 100 : 0;

    const result = await prisma.quizResult.create({
      data: {
        student_id: studentId,
        quiz_id: quizId,
        score,
        percentage,
        responses: {
          create: responseData,
        },
      },
    });

    return { success: true, resultId: result.id };
  } catch (error: any) {
    console.error("[SubmitQuiz] Error:", error);
    return { success: false, error: "Failed to submit quiz" };
  }
}

export async function getQuizResultDetail(resultId: number) {
  try {
    const result = await prisma.quizResult.findUnique({
      where: { id: resultId },
      include: {
        quiz: {
          include: {
            subject: true,
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        responses: true,
      },
    });
    return result;
  } catch (error) {
    console.error("[GetQuizResultDetail] Error:", error);
    return null;
  }
}

export async function getQuizzes() {
  return await prisma.quiz.findMany({
    include: {
      subject: true,
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { id: "desc" },
  });
}

export async function deleteQuiz(id: number) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.quiz.delete({ where: { id } });
  revalidatePath("/admin/quizzes");
  return { success: true };
}
