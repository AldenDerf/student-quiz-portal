import { auth } from "@/auth";
import { prisma } from "@/prisma/db";
import { redirect } from "next/navigation";
import QuizEngineClient from "./QuizEngineClient";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId: quizIdParam } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    redirect("/api/auth/signin");
  }

  const quizId = parseInt(quizIdParam);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      subject: true,
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  if (!quiz) {
    redirect("/student/portal");
  }

  return (
    <QuizEngineClient
      quiz={JSON.parse(JSON.stringify(quiz))}
      studentId={parseInt(session.user.id)}
    />
  );
}
