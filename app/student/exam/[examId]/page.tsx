import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma/db";
import ExamEngineClient from "./ExamEngineClient";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const session = await auth();

  // Protect route
  if (!session?.user || session.user.role !== "student") {
    redirect("/student/login");
  }

  const { examId: rawExamId } = await params;
  const examId = parseInt(rawExamId);

  if (isNaN(examId)) {
    return <div className="p-8 text-center text-zinc-600">Invalid Exam ID</div>;
  }

  // Fetch Exam and fully populated questions
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: true,
      questions: {
        include: {
          options: true,
        },
        orderBy: { order_index: "asc" },
      },
    },
  });

  if (!exam) {
    return (
      <div className="p-8 text-center text-zinc-600">
        Exam not found or unavailable.
      </div>
    );
  }

  // Check for previous attempts
  const results = await prisma.examResult.findMany({
    where: { student_id: parseInt(session.user.id), exam_id: examId },
    orderBy: { taken_at: "asc" },
  });

  if (results.length >= 2) {
    redirect("/student/portal"); // Or show an error message
  }

  // Shuffle helper (Fisher-Yates)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 1. Shuffle the Questions themselves
  const shuffledQuestions = shuffleArray(exam.questions).map((q) => ({
    ...q,
    // 2. Shuffle the Options within each question
    options: shuffleArray(q.options),
  }));

  const shuffledExam = {
    ...exam,
    questions: shuffledQuestions,
  };

  // Convert dates and BigInts if any to prevent React Serialization errors
  const safeExam = JSON.parse(JSON.stringify(shuffledExam));

  return (
    <ExamEngineClient exam={safeExam} studentId={parseInt(session.user.id)} />
  );
}
