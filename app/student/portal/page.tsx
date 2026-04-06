import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma/db";
import Link from "next/link";
import { BookOpen, Clock, Play } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default async function StudentPortalPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    console.log("[Portal] No student session, redirecting to login...");
    redirect("/student/login");
  }

  const studentId = parseInt(session.user.id);
  console.log(
    `[Portal] Loading portal for Student: ${session.user.name} (ID: ${studentId})`,
  );

  // Fetch active exams that belong to subjects the student is enrolled in
  // First, find subjects they are enrolled in:
  const enrollments = await prisma.enrollment.findMany({
    where: { student_id: studentId },
    select: { subject_id: true },
  });

  const subjectIds = enrollments.map((e) => e.subject_id);

  // Find all exams matching those subjects
  const availableExams = await prisma.exam.findMany({
    where: {
      subject_id: { in: subjectIds },
    },
    include: {
      subject: true,
      exam_results: {
        where: { student_id: studentId },
      },
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Portal Navbar */}
      <nav className="bg-indigo-600 px-8 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-white font-bold text-xl">Student Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-indigo-100 text-sm font-medium">
            Welcome, {session.user.name}
          </span>
          <LogoutButton className="text-sm bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-md transition-colors" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-8 mt-6">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-900">
            Your Active Exams
          </h2>
          <p className="text-zinc-500 mt-1">
            Select an exam below to begin. Remember, exams are strictly timed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableExams.length === 0 ? (
            <div className="md:col-span-2 text-center p-12 bg-white rounded-2xl border border-zinc-200">
              <p className="text-zinc-500">
                You currently have no active exams assigned to your enrolled
                subjects.
              </p>
            </div>
          ) : (
            availableExams.map((exam) => {
              const hasTaken = exam.exam_results.length > 0;
              const result = hasTaken ? exam.exam_results[0] : null;

              return (
                <div
                  key={exam.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                  {exam.exam_results.length === 1 && (
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                      Retake Available
                    </div>
                  )}

                  {exam.exam_results.length >= 2 && (
                    <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                      COMPLETED
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className={`p-3 rounded-xl ${hasTaken ? "bg-green-50 text-green-600" : "bg-indigo-50 text-indigo-600"}`}>
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        {exam.subject.subject_code}
                      </span>
                      <h3 className="text-lg font-bold text-zinc-800 leading-tight mt-0.5">
                        {exam.exam_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-zinc-500 mt-2">
                        <Clock size={14} /> 60 Minutes limit
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-zinc-500 uppercase tracking-tight">
                        Attempts Used:
                      </span>
                      <span
                        className={`text-sm font-bold ${exam.exam_results.length >= 2 ? "text-red-500" : "text-indigo-600"}`}>
                        {exam.exam_results.length} / 2
                      </span>
                    </div>

                    {exam.exam_results.length === 0 ? (
                      <Link
                        href={`/student/exam/${exam.id}`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-colors">
                        <Play size={16} /> Begin Exam
                      </Link>
                    ) : exam.exam_results.length === 1 ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-zinc-500">
                            First Score:{" "}
                            <strong className="text-zinc-700">
                              {exam.exam_results[0].score} / {exam.total_marks}
                            </strong>
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/student/exam/${exam.id}`}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm shadow-sm transition-colors">
                            Retake Exam
                          </Link>
                          <Link
                            href="/student/results"
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-bold text-sm transition-colors">
                            Results
                          </Link>
                        </div>
                        <p className="text-[10px] text-amber-600 font-medium italic text-center">
                          Note: Retake score is calculated as 95% of your actual
                          performance.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-zinc-500">
                            Latest Score:{" "}
                            <strong className="text-green-600">
                              {
                                exam.exam_results[exam.exam_results.length - 1]
                                  .score
                              }{" "}
                              / {exam.total_marks}
                            </strong>
                          </span>
                        </div>
                        <Link
                          href="/student/results"
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg font-semibold transition-colors">
                          View Final Results
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
