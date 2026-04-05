"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { submitExam } from "@/app/actions/exam";
import { useRouter } from "next/navigation";

type Option = {
  id: number;
  option_text: string;
};

type Question = {
  id: number;
  question_text: string;
  marks: number;
  options: Option[];
};

type Exam = {
  id: number;
  exam_name: string;
  subject: { subject_name: string; subject_code: string };
  questions: Question[];
};

export default function ExamEngineClient({
  exam,
  studentId,
}: {
  exam: Exam;
  studentId: number;
}) {
  const router = useRouter();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = exam.questions[currentIdx];
  const totalQuestions = exam.questions.length;
  const answeredCount = Object.keys(selections).length;
  const progressPercent =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Formatting Timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinalSubmit(); // Auto Submit
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  // Submission handler
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await submitExam(studentId, exam.id, selections);
      if (result.success) {
        router.push("/student/results");
      } else {
        alert("Submission failed. The score may not be saved.");
        setIsSubmitting(false);
      }
    } catch (e) {
      setIsSubmitting(false);
    }
  }, [selections, studentId, exam.id, isSubmitting, router]);

  // If no questions exist in DB
  if (totalQuestions === 0) {
    return (
      <div className="p-12 text-center text-zinc-500">
        This exam contains no questions yet. Contact your instructor.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
        <div>
          <h1 className="text-xl font-bold text-zinc-800">
            {exam.subject.subject_code} - {exam.subject.subject_name}
          </h1>
          <p className="text-sm text-zinc-500 font-medium">{exam.exam_name}</p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg font-semibold ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-indigo-50 text-indigo-700"}`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-8 align-start">
        {/* Core Question Viewport */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
          {/* Progress Bar */}
          <div className="w-full bg-zinc-100 h-1.5">
            <div
              className="bg-indigo-600 h-1.5 transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercent}%` }}></div>
          </div>

          <div className="p-8 flex-1 flex flex-col">
            <div className="mb-8">
              <span className="text-indigo-600 font-semibold text-sm tracking-wider uppercase mb-2 block">
                Question {currentIdx + 1} of {totalQuestions}
              </span>
              <h2 className="text-2xl font-semibold text-zinc-800 leading-snug">
                {currentQuestion.question_text}
              </h2>
            </div>

            <div className="space-y-3 flex-1">
              {currentQuestion.options.map((opt) => {
                const isSelected = selections[currentQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() =>
                      setSelections((prev) => ({
                        ...prev,
                        [currentQuestion.id]: opt.id,
                      }))
                    }
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                      ${isSelected ? "border-indigo-600 bg-indigo-50/50" : "border-zinc-200 hover:border-indigo-300 hover:bg-zinc-50"}`}>
                    <span
                      className={`text-lg ${isSelected ? "text-indigo-900 font-medium" : "text-zinc-700"}`}>
                      {opt.option_text}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? "border-indigo-600 bg-indigo-600" : "border-zinc-300 group-hover:border-indigo-300"}`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer */}
            <div className="pt-8 mt-6 flex justify-between items-center border-t border-zinc-100">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-zinc-600 font-medium hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
                <ChevronLeft size={18} /> Previous
              </button>

              {currentIdx < totalQuestions - 1 ? (
                <button
                  onClick={() =>
                    setCurrentIdx((prev) =>
                      Math.min(totalQuestions - 1, prev + 1),
                    )
                  }
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all active:scale-95">
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-70">
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Check size={18} />
                  )}
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Question Palette */}
        <div className="w-full md:w-72 md:shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 sticky top-24">
            <h3 className="text-zinc-800 font-semibold mb-4 flex items-center justify-between">
              Question Palette
              <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                {answeredCount} / {totalQuestions} answered
              </span>
            </h3>

            <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {exam.questions.map((q, idx) => {
                const isAnswered = !!selections[q.id];
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`
                      w-10 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center
                      ${isCurrent ? "ring-2 ring-indigo-600 ring-offset-2" : ""}
                      ${isAnswered ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-zinc-50 text-zinc-500 border border-zinc-200 hover:bg-zinc-100"}
                    `}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium shadow-sm disabled:opacity-50 transition-colors">
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Finish & Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
