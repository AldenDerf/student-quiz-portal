import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma/db";
import { CheckCircle, AlertTriangle, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function StudentResultsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    redirect("/student/login");
  }

  // Fetch the latest exam result for this student
  const latestResult = await prisma.examResult.findFirst({
    where: { student_id: parseInt(session.user.id) },
    orderBy: { taken_at: "desc" },
    include: {
      exam: {
        include: { subject: true },
      },
    },
  });

  if (!latestResult) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-md text-center">
          <BookOpen className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            No Results Found
          </h2>
          <p className="text-zinc-600 mb-6">You haven't taken any exams yet.</p>
          <Link
            href="/student/portal"
            className="inline-flex justify-center py-2 px-4 shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition">
            Go to Portal
          </Link>
        </div>
      </div>
    );
  }

  const isPassing = Number(latestResult.percentage) >= 60;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans sm:p-8 lg:p-12 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Ribbon */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            href="/student/portal"
            className="text-indigo-600 font-medium hover:underline text-sm flex items-center">
            &larr; Back to Portal
          </Link>
        </div>

        {/* Global Result Card */}
        <div
          className={`bg-white rounded-3xl shadow-sm overflow-hidden border-2 ${isPassing ? "border-green-100" : "border-red-100"}`}>
          <div
            className={`px-8 py-10 text-center ${isPassing ? "bg-gradient-to-b from-green-50 to-white" : "bg-gradient-to-b from-red-50 to-white"}`}>
            {isPassing ? (
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50">
                <CheckCircle className="text-green-600 h-10 w-10" />
              </div>
            ) : (
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50">
                <AlertTriangle className="text-red-500 h-10 w-10" />
              </div>
            )}

            <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">
              {isPassing ? "Congratulations!" : "Keep Studying!"}
            </h1>
            <p className="text-lg text-zinc-600 font-medium mb-8">
              You scored{" "}
              <span
                className={`font-bold ${isPassing ? "text-green-600" : "text-red-500"}`}>
                {Number(latestResult.percentage)}%
              </span>{" "}
              on {latestResult.exam.exam_name}
            </p>

            <div className="inline-flex items-center gap-8 bg-zinc-50 px-8 py-4 rounded-xl border border-zinc-200">
              <div className="text-center">
                <span className="block text-sm font-semibold text-zinc-500 uppercase tracking-widest">
                  Score
                </span>
                <span className="block text-2xl font-bold text-zinc-800">
                  {latestResult.score}{" "}
                  <span className="text-base font-medium text-zinc-400">
                    / {latestResult.exam.total_marks}
                  </span>
                </span>
              </div>
              <div className="w-px h-12 bg-zinc-200"></div>
              <div className="text-center">
                <span className="block text-sm font-semibold text-zinc-500 uppercase tracking-widest">
                  Time
                </span>
                <span className="block text-2xl font-bold text-zinc-800">
                  Submitted
                </span>
              </div>
            </div>
          </div>

          {/* AI Feedback Section */}
          <div className="px-8 pb-10">
            <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="h-24 w-24 text-indigo-600" />
              </div>
              <h3 className="flex items-center gap-2 text-indigo-900 font-bold mb-3 uppercase tracking-wide text-sm">
                <Sparkles size={16} className="text-indigo-600" />
                AI Performance Analysis
              </h3>
              <p className="text-indigo-950/80 leading-relaxed font-medium relative z-10 text-lg">
                "{latestResult.ai_feedback}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
