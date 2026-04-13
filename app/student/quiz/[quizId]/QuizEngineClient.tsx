"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Play,
  ShieldAlert,
  BookOpen,
} from "lucide-react";
import { submitQuiz } from "@/app/actions/quiz";
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

type Quiz = {
  id: number;
  quiz_name: string;
  subject: { subject_name: string; subject_code: string };
  questions: Question[];
};

export default function QuizEngineClient({
  quiz,
  studentId,
}: {
  quiz: Quiz;
  studentId: number;
}) {
  const router = useRouter();

  const [isStarted, setIsStarted] = useState(false);
  const [violations, setViolations] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selections, setSelections] = useState<Record<number, number>>({});

  // Strategy: 1 minute per item
  const [timeLeft, setTimeLeft] = useState(quiz.questions.length * 60);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsWarning, setFsWarning] = useState<number | "expired" | null>(null);
  const fsCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = quiz.questions[currentIdx];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(selections).length;
  const progressPercent =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const storageKey = `quiz_progress_${studentId}_${quiz.id}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const { selections: s, currentIdx: i } = JSON.parse(saved);
        if (s) setSelections(s);
        if (typeof i === "number") setCurrentIdx(i);
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (isStarted) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ selections, currentIdx }),
      );
    }
  }, [selections, currentIdx, isStarted, storageKey]);

  useEffect(() => {
    return () => {
      if (isStarted) localStorage.removeItem(storageKey);
    };
  }, [isStarted, storageKey]);

  const selectionsRef = useRef(selections);
  useEffect(() => {
    selectionsRef.current = selections;
  }, [selections]);

  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionStatus("Submitting your quiz...");

    try {
      const result = await submitQuiz(
        studentId,
        quiz.id,
        selectionsRef.current,
      );
      if (result.success) {
        localStorage.removeItem(storageKey);
        router.push("/student/portal"); // Or to a result page if you have one
      } else {
        alert(result.error || "Submission failed.");
        setIsSubmitting(false);
        setSubmissionStatus(null);
      }
    } catch (e) {
      alert("Network error. Please try again.");
      setIsSubmitting(false);
      setSubmissionStatus(null);
    }
  }, [studentId, quiz.id, isSubmitting, router, storageKey]);

  // Lockdown Logic (Same as Exam)
  useEffect(() => {
    if (!isStarted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations((v) => v + 1);
      }
    };

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        let count = 5;
        setFsWarning(count);
        if (fsCountdownRef.current) clearInterval(fsCountdownRef.current);
        fsCountdownRef.current = setInterval(() => {
          count -= 1;
          if (count <= 0) {
            clearInterval(fsCountdownRef.current!);
            fsCountdownRef.current = null;
            setFsWarning("expired");
          } else {
            setFsWarning(count);
          }
        }, 1000);
      } else {
        if (fsCountdownRef.current) {
          clearInterval(fsCountdownRef.current);
          fsCountdownRef.current = null;
        }
        setFsWarning(null);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (fsCountdownRef.current) clearInterval(fsCountdownRef.current);
    };
  }, [isStarted]);

  useEffect(() => {
    if (violations === 0 || !isStarted) return;
    if (violations >= 5) {
      alert("CRITICAL: 5 strikes reached. Quiz auto-submitting.");
      handleFinalSubmit();
    } else {
      setIsStarted(false);
      alert(`WARNING: Strike ${violations} of 5 detected.`);
    }
  }, [violations, handleFinalSubmit]);

  useEffect(() => {
    if (!isStarted) return;
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isStarted, handleFinalSubmit]);

  const startQuiz = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsStarted(true);
      setIsFullscreen(true);
    } catch (err) {
      setIsStarted(true);
    }
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-zinc-200 p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <BookOpen className="text-blue-600 h-10 w-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">
            {quiz.quiz_name}
          </h1>
          <p className="text-blue-600 font-semibold mb-8">
            {quiz.subject.subject_code} - {quiz.subject.subject_name}
          </p>

          <div className="text-left space-y-4 mb-10 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
            <h3 className="font-bold text-zinc-800 flex items-center gap-2">
              <ShieldAlert className="text-red-500" size={18} /> Quiz Rules:
            </h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 text-sm font-medium">
              <li>Automatic Fullscreen Mode required.</li>
              <li>
                <strong>5-Strike Rule:</strong> Tab switching or Alt-Tab will
                end your quiz.
              </li>
              <li>
                Timer: <strong>{totalQuestions} minutes</strong> (1 min per
                item).
              </li>
              <li>Progress is saved automatically until submission.</li>
            </ul>
            {violations > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-bold text-center">
                  Strikes: {violations} / 5
                </p>
              </div>
            )}
          </div>
          <button
            onClick={startQuiz}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-3">
            <Play size={20} /> Start Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col">
      {/* Fullscreen Warning Overlay */}
      {fsWarning !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border-4 border-red-500">
            <h2 className="text-2xl font-extrabold text-red-700 mb-2">
              Fullscreen Required!
            </h2>
            {fsWarning === "expired" ? (
              <button
                onClick={() => document.documentElement.requestFullscreen()}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-bold animate-pulse">
                Return to Fullscreen
              </button>
            ) : (
              <div className="text-7xl font-black text-red-600">
                {fsWarning}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
        <div>
          <h1 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
            {quiz.subject.subject_code}
            {violations > 0 && (
              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                Strikes: {violations} / 5
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500 font-medium">{quiz.quiz_name}</p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg font-semibold ${timeLeft < 60 ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-700"}`}>
          <Clock size={20} /> {formatTime(timeLeft)}
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="w-full bg-zinc-100 h-1.5">
            <div
              className="bg-blue-600 h-1.5 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}></div>
          </div>

          <div className="p-8">
            <span className="text-blue-600 font-bold text-sm uppercase mb-2 block">
              Question {currentIdx + 1} of {totalQuestions}
            </span>
            <h2 className="text-2xl font-semibold text-zinc-800 mb-8">
              {currentQuestion.question_text}
            </h2>

            <div className="space-y-3">
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
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${isSelected ? "border-blue-600 bg-blue-50/50" : "border-zinc-200 hover:border-blue-300 hover:bg-zinc-50"}`}>
                    <span
                      className={`text-lg ${isSelected ? "text-blue-900 font-medium" : "text-zinc-700"}`}>
                      {opt.option_text}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-blue-600 bg-blue-600" : "border-zinc-300 group-hover:border-blue-300"}`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-8 mt-10 flex justify-between border-t border-zinc-100">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-6 py-2.5 rounded-lg text-zinc-600 font-medium hover:bg-zinc-100 disabled:opacity-40">
                Previous
              </button>

              {currentIdx < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all active:scale-95">
                  Next
                </button>
              ) : (
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-10 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md disabled:opacity-70">
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Submit Quiz"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200">
          <h3 className="font-bold text-zinc-800 mb-4 ">Question Progress</h3>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${idx === currentIdx ? "ring-2 ring-blue-600 ring-offset-2" : ""} ${selections[q.id] ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"}`}>
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
