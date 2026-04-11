"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Play,
} from "lucide-react";
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

  const [isStarted, setIsStarted] = useState(false);
  const [violations, setViolations] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  // Fullscreen exit overlay: null = hidden, number = countdown, 'expired' = must click
  const [fsWarning, setFsWarning] = useState<number | "expired" | null>(null);
  const fsCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const storageKey = `exam_progress_${studentId}_${exam.id}`;

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const { selections: s, currentIdx: i } = JSON.parse(saved);
        if (s) {
          setSelections(s);
          selectionsRef.current = s;
        }
        if (typeof i === "number") setCurrentIdx(i);
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
  }, [storageKey]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (isStarted) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ selections, currentIdx }),
      );
    }
  }, [selections, currentIdx, isStarted, storageKey]);

  // Clear autosave when student NAVIGATES AWAY (back button, link, etc.)
  // useEffect cleanup reliably fires on unmount regardless of navigation method
  useEffect(() => {
    return () => {
      // Only clear if exam was started (i.e. the student navigated away mid-exam)
      // Successful submission already calls removeItem explicitly
      if (isStarted) {
        localStorage.removeItem(storageKey);
      }
    };
  }, [isStarted, storageKey]);

  // Track current selections in a ref for stable use in event listeners
  const selectionsRef = useRef(selections);
  useEffect(() => {
    selectionsRef.current = selections;
  }, [selections]);

  // Stable Submission handler
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionStatus("Submitting your answers...");

    // Timeout alert for slow networks
    const statusTimeout = setTimeout(() => {
      setSubmissionStatus(
        "Server is busy, still processing... please do not refresh.",
      );
    }, 6000);

    try {
      // Use the stable ref to get the absolute latest selections
      const finalSelections = selectionsRef.current;
      const result = await submitExam(studentId, exam.id, finalSelections);
      clearTimeout(statusTimeout);

      if (result.success) {
        localStorage.removeItem(storageKey);
        router.push("/student/results");
      } else {
        alert(result.error || "Submission failed. The score may not be saved.");
        setIsSubmitting(false);
        setSubmissionStatus(null);
      }
    } catch (e) {
      clearTimeout(statusTimeout);
      alert("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
      setSubmissionStatus(null);
    }
  }, [studentId, exam.id, isSubmitting, router, storageKey]); // Removed selections from dependencies

  // Lockdown Logic: Fullscreen & Visibility
  useEffect(() => {
    if (!isStarted) return;

    // 1. Prevent accidental refresh/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // 2. Detect Tab Switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        processViolation("Tab switching detected");
      }
    };

    // 3. Track Fullscreen — show countdown overlay on exit, require click to return
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        // Exited fullscreen — start countdown
        let count = 5;
        setFsWarning(count);
        if (fsCountdownRef.current) clearInterval(fsCountdownRef.current);
        fsCountdownRef.current = setInterval(() => {
          count -= 1;
          if (count <= 0) {
            clearInterval(fsCountdownRef.current!);
            fsCountdownRef.current = null;
            // Browsers BLOCK requestFullscreen() from timers (no user gesture).
            // Show "expired" state so the student must click a button.
            setFsWarning("expired");
          } else {
            setFsWarning(count);
          }
        }, 1000);
      } else {
        // Back in fullscreen — cancel overlay
        if (fsCountdownRef.current) {
          clearInterval(fsCountdownRef.current);
          fsCountdownRef.current = null;
        }
        setFsWarning(null);
      }
    };

    const processViolation = (reason: string) => {
      setViolations((v) => v + 1);
      // We'll handle the logic (alerts/submission) in a side-effect useEffect
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
  }, [isStarted]); // Simplified dependencies

  // Effect to handle violations (Strikes)
  useEffect(() => {
    if (violations === 0 || !isStarted) return;

    if (violations >= 5) {
      alert(
        "CRITICAL: 5 strikes reached. Your exam is being submitted automatically.",
      );
      handleFinalSubmit();
    } else {
      setIsStarted(false); // Return to instructions screen immediately to stop listeners
      alert(
        `WARNING: Strike ${violations} of 5. You must return to the instruction screen and re-enter fullscreen.`,
      );
    }
  }, [violations, handleFinalSubmit]); // isStarted NOT in dependency to avoid loop when we set it to false

  // Timer logic
  useEffect(() => {
    if (!isStarted) return;
    if (timeLeft <= 0) {
      handleFinalSubmit(); // Auto Submit
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isStarted, handleFinalSubmit]);

  const startExam = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsStarted(true);
      setIsFullscreen(true);
    } catch (err) {
      console.error("Fullscreen request failed", err);
      // Fallback: still start even if fullscreen fails (e.g. browser restriction)
      setIsStarted(true);
    }
  };

  // If no questions exist in DB
  if (totalQuestions === 0) {
    return (
      <div className="p-12 text-center text-zinc-500">
        This exam contains no questions yet. Contact your instructor.
      </div>
    );
  }

  // PRE-EXAM START SCREEN
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-zinc-200 p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <Clock className="text-indigo-600 h-10 w-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-4">
            Security Check & Instructions
          </h1>
          <div className="text-left space-y-4 mb-10 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
            <h3 className="font-bold text-zinc-800">
              Exam Rules (Strict Lockdown):
            </h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 text-sm">
              <li>
                This exam will enter <strong>Fullscreen Mode</strong>{" "}
                immediately.
              </li>
              <li>
                <strong>5-Strike Rule:</strong> Any tab switch or Alt-Tab will
                be recorded as a strike.
              </li>
              <li>
                Exiting fullscreen is allowed but recommended to stay for better
                focus.
              </li>
              <li>
                On the <strong>5th Strike</strong>, the exam will automatically
                submit and end.
              </li>
              <li>Calculators and external aids are prohibited.</li>
              <li>
                Timer: <strong>60 minutes</strong>. The exam auto-submits on
                timeout.
              </li>
            </ul>
            {violations > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-bold animate-pulse text-center">
                  Strikes Used: {violations} / 5
                </p>
              </div>
            )}
          </div>
          <button
            onClick={startExam}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-100 transition-all transform active:scale-95 flex items-center justify-center gap-3">
            <Play size={20} /> I Understand, Start Exam
          </button>
          <p className="mt-6 text-xs text-zinc-400">
            By clicking start, you agree to follow the academic integrity
            guidelines.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col">
      {/* Fullscreen Exit Warning Overlay */}
      {fsWarning !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border-4 border-red-500">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-extrabold text-red-700 mb-2">
              Fullscreen Required!
            </h2>
            {fsWarning === "expired" ? (
              <>
                <p className="text-zinc-600 mb-2 text-sm font-medium">
                  You MUST return to fullscreen to continue.
                </p>
                <p className="text-xs text-zinc-400 mb-4">
                  Your exam time is still running:
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-mono text-2xl font-bold mb-6 ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-indigo-50 text-indigo-700"}`}>
                  <Clock size={20} /> {formatTime(timeLeft)}
                </div>
                <button
                  onClick={() =>
                    document.documentElement.requestFullscreen().catch(() => {})
                  }
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all animate-pulse">
                  🔒 Click to Return to Fullscreen
                </button>
              </>
            ) : (
              <>
                <p className="text-zinc-600 mb-6 text-sm">
                  You exited fullscreen. Click the button below or wait:
                </p>
                <div className="text-7xl font-black text-red-600 mb-6">
                  {fsWarning}
                </div>
                <button
                  onClick={() => {
                    if (fsCountdownRef.current) {
                      clearInterval(fsCountdownRef.current);
                      fsCountdownRef.current = null;
                    }
                    setFsWarning(null);
                    document.documentElement
                      .requestFullscreen()
                      .catch(() => {});
                  }}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all">
                  Return to Fullscreen Now
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
        <div>
          <h1 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
            {exam.subject.subject_code}
            {violations > 0 && (
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">
                Strikes: {violations} / 5
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500 font-medium">{exam.exam_name}</p>
        </div>
        <div className="flex items-center gap-4">
          {!isFullscreen && (
            <button
              onClick={() => document.documentElement.requestFullscreen()}
              className="text-xs text-red-600 font-bold underline hover:text-red-700 transition-colors">
              Re-enter Fullscreen (Required)
            </button>
          )}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg font-semibold ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-indigo-50 text-indigo-700"}`}>
            <Clock size={20} />
            {formatTime(timeLeft)}
          </div>
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
                  onClick={() => handleFinalSubmit()}
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
            {submissionStatus && (
              <div className="mt-4 text-center text-sm font-medium text-indigo-600 animate-pulse">
                {submissionStatus}
              </div>
            )}
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
                onClick={() => handleFinalSubmit()}
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
