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

  // Convert dates and BigInts if any to prevent React Serialization errors
  const safeExam = JSON.parse(JSON.stringify(exam));

  return (
    <ExamEngineClient exam={safeExam} studentId={parseInt(session.user.id)} />
  );
}
