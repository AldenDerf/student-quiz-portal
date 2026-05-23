import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma/db";
import ResultsClient from "./ResultsClient";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=" + encodeURIComponent("/dashboard/results"));
  }

  if (session.user.role === "student") {
    redirect("/student/portal");
  }

  const [examResults, quizResults, subjects, exams, quizzes] = await Promise.all([
    prisma.examResult.findMany({
      include: {
        student: {
          include: {
            enrollments: true,
          },
        },
        exam: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        taken_at: "desc",
      },
    }),
    prisma.quizResult.findMany({
      include: {
        student: {
          include: {
            enrollments: true,
          },
        },
        quiz: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        taken_at: "desc",
      },
    }),
    prisma.subject.findMany({
      orderBy: {
        subject_code: "asc",
      },
    }),
    prisma.exam.findMany({
      include: {
        subject: true,
      },
      orderBy: {
        exam_name: "asc",
      },
    }),
    prisma.quiz.findMany({
      include: {
        subject: true,
      },
      orderBy: {
        quiz_name: "asc",
      },
    }),
  ]);

  // Clean data before sending to client component to avoid non-serializable elements or potential leaks
  const cleanedExamResults = examResults.map((er) => ({
    id: er.id,
    studentId: er.student_id,
    studentNum: er.student.student_num,
    studentName: `${er.student.lastname}, ${er.student.firstname} ${er.student.middlename || ""}`.trim(),
    studentEmail: er.student.email,
    section: er.student.enrollments.find((e) => e.subject_id === er.exam.subject_id)?.section || "N/A",
    examId: er.exam_id,
    examName: er.exam.exam_name,
    totalMarks: er.exam.total_marks,
    subjectCode: er.exam.subject.subject_code,
    subjectName: er.exam.subject.subject_name,
    score: er.score,
    percentage: er.percentage ? Number(er.percentage) : 0,
    takenAt: er.taken_at.toISOString(),
  }));

  const cleanedQuizResults = quizResults.map((qr) => ({
    id: qr.id,
    studentId: qr.student_id,
    studentNum: qr.student.student_num,
    studentName: `${qr.student.lastname}, ${qr.student.firstname} ${qr.student.middlename || ""}`.trim(),
    studentEmail: qr.student.email,
    section: qr.student.enrollments.find((e) => e.subject_id === qr.quiz.subject_id)?.section || "N/A",
    quizId: qr.quiz_id,
    quizName: qr.quiz.quiz_name,
    totalMarks: qr.quiz.total_marks,
    subjectCode: qr.quiz.subject.subject_code,
    subjectName: qr.quiz.subject.subject_name,
    score: qr.score,
    percentage: qr.percentage ? Number(qr.percentage) : 0,
    takenAt: qr.taken_at.toISOString(),
  }));

  const cleanedSubjects = subjects.map((s) => ({
    id: s.id,
    subjectCode: s.subject_code,
    subjectName: s.subject_name,
  }));

  const cleanedExams = exams.map((e) => ({
    id: e.id,
    examName: e.exam_name,
    totalMarks: e.total_marks,
    subjectCode: e.subject.subject_code,
    subjectName: e.subject.subject_name,
  }));

  const cleanedQuizzes = quizzes.map((q) => ({
    id: q.id,
    quizName: q.quiz_name,
    totalMarks: q.total_marks,
    subjectCode: q.subject.subject_code,
    subjectName: q.subject.subject_name,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Assessment Results</h1>
        <p className="text-gray-500 mt-1">Track and monitor student quiz and exam submissions</p>
      </div>

      <ResultsClient 
        examResults={cleanedExamResults}
        quizResults={cleanedQuizResults}
        subjects={cleanedSubjects}
        exams={cleanedExams}
        quizzes={cleanedQuizzes}
      />
    </div>
  );
}
