import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getQuizResultDetail } from "@/app/actions/quiz";
import Link from "next/link";
import { Check, X, ChevronLeft, ShieldAlert } from "lucide-react";

export default async function QuizResultDetailPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    redirect("/student/login");
  }

  const result = await getQuizResultDetail(parseInt(resultId));

  if (!result || result.student_id !== parseInt(session.user.id)) {
    redirect("/student/portal");
  }

  const { quiz, responses, percentage, score } = result;
  const isPassing = Number(percentage) >= 60;
  const hasHistory = responses.length > 0;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-20">
      <header className="bg-white border-b border-zinc-200 px-8 py-5 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/student/portal"
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-800">
              Quiz Review{" "}
              {!hasHistory && (
                <span className="text-zinc-400 font-normal">(View Mode)</span>
              )}
            </h1>
            <p className="text-sm text-zinc-500 font-medium">
              {quiz.subject.subject_code} - {quiz.quiz_name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-zinc-400 uppercase">
            Submitted On
          </p>
          <p className="text-sm font-semibold text-zinc-700">
            {new Date(result.taken_at).toLocaleDateString()} at{" "}
            {new Date(result.taken_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 mt-4">
        {/* Warning if no history */}
        {!hasHistory && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800 shadow-sm">
            <ShieldAlert className="shrink-0" size={20} />
            <p className="text-sm font-medium">
              Detailed response history is not available for this session.
              Showing correct answers for your review.
            </p>
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden text-center p-10">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isPassing ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            {isPassing ? <Check size={40} /> : <X size={40} />}
          </div>
          <h2 className="text-4xl font-black text-zinc-900 mb-2">
            {score} / {quiz.total_marks}
          </h2>
          <p className="text-xl font-bold text-zinc-500 mb-6 uppercase tracking-widest">
            Your Final Score ({Number(percentage).toFixed(1)}%)
          </p>

          <div
            className={`py-3 px-8 rounded-2xl inline-block font-black text-lg ${isPassing ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {isPassing ? "PASSED" : "KEEP STUDYING"}
          </div>
        </div>

        <h3 className="text-2xl font-black text-zinc-800 pt-4 flex items-center gap-3">
          Detailed Item Review
        </h3>

        <div className="space-y-6">
          {quiz.questions.map((q, idx) => {
            const response = responses.find((r) => r.question_id === q.id);
            const isCorrect = response?.is_correct ?? false;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${hasHistory ? (isCorrect ? "border-green-100" : "border-red-100") : "border-zinc-100"}`}>
                <div
                  className={`px-6 py-4 font-black flex items-center justify-between ${hasHistory ? (isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700") : "bg-zinc-50 text-zinc-600"}`}>
                  <span className="text-sm uppercase tracking-wider">
                    Item {idx + 1}
                  </span>
                  <div className="flex items-center gap-2 text-base">
                    {hasHistory ? (
                      isCorrect ? (
                        <>
                          <Check size={20} strokeWidth={3} /> CORRECT
                        </>
                      ) : (
                        <>
                          <X size={20} strokeWidth={3} /> INCORRECT
                        </>
                      )
                    ) : (
                      <span className="text-zinc-400 font-bold opacity-50">
                        QUESTION PREVIEW
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <p className="text-xl font-bold text-zinc-800">
                    {q.question_text}
                  </p>
                  <div className="grid gap-3">
                    {q.options.map((opt) => {
                      const isStudentSelected =
                        response?.selected_option_id === opt.id;
                      const isCorrectAnswer = opt.is_correct;

                      let badgeStyle =
                        "border-zinc-100 text-zinc-500 bg-zinc-50";

                      if (hasHistory) {
                        if (isStudentSelected && isCorrectAnswer)
                          badgeStyle =
                            "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-100";
                        else if (isStudentSelected && !isCorrectAnswer)
                          badgeStyle =
                            "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-100";
                        else if (isCorrectAnswer)
                          badgeStyle =
                            "border-green-500 bg-green-50 text-green-700 border-dashed";
                      } else if (isCorrectAnswer) {
                        badgeStyle =
                          "border-green-500 bg-green-50 text-green-700 font-bold";
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${badgeStyle}`}>
                          <span className="font-semibold">
                            {opt.option_text}
                          </span>
                          <div className="flex items-center gap-2">
                            {isStudentSelected && (
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm ${isCorrectAnswer ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
                                Your Selection
                              </span>
                            )}
                            {isCorrectAnswer && (
                              <span className="text-[10px] font-black uppercase bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded flex items-center gap-1">
                                <Check size={12} strokeWidth={4} /> Correct
                                Option
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
