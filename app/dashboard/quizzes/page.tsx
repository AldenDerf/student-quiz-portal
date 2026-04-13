"use client";

import { useState, useEffect } from "react";
import {
  getQuizzes,
  uploadQuiz,
  deleteQuiz,
  getSubjects,
} from "@/app/actions/quiz";
import {
  Loader2,
  Upload,
  Trash2,
  BookOpen,
  Clock,
  X,
  Plus,
} from "lucide-react";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quizName, setQuizName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [questionsFile, setQuestionsFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [quizData, subjectData] = await Promise.all([
      getQuizzes(),
      getSubjects(),
    ]);
    setQuizzes(quizData);
    setSubjects(subjectData);
    setLoading(false);
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizName || !subjectId || !questionsFile) {
      setMessage({
        type: "error",
        text: "Please fill in all fields and select a file.",
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          throw new Error("JSON must be an array of questions.");
        }

        const result = await uploadQuiz(quizName, parseInt(subjectId), json);

        if (result.success) {
          setMessage({ type: "success", text: "Quiz created successfully!" });
          setIsModalOpen(false);
          setQuizName("");
          setSubjectId("");
          setQuestionsFile(null);
          fetchData();
        } else {
          setMessage({
            type: "error",
            text: result.error || "Failed to create quiz",
          });
        }
      } catch (err: any) {
        setMessage({
          type: "error",
          text:
            err.name === "SyntaxError"
              ? "Invalid JSON file structure."
              : err.message,
        });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(questionsFile);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    const result = await deleteQuiz(id);
    if (result.success) {
      fetchData();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
          <p className="text-gray-500">Upload and manage student quizzes</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-all">
          <Plus size={20} />
          Create New Quiz
        </button>
      </div>

      {message && !isModalOpen && (
        <div
          className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Create New Quiz
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  Quiz Name
                </label>
                <input
                  type="text"
                  required
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. Midterm Quiz"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  Subject
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                  <option value="">Select a subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.subject_code}] {s.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  Questions JSON
                </label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".json"
                    required
                    onChange={(e) =>
                      setQuestionsFile(e.target.files?.[0] || null)
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center text-gray-500 text-sm">
                    {questionsFile ? (
                      <span className="text-blue-600 font-medium">
                        {questionsFile.name}
                      </span>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={20} />
                        Choose JSON File
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message.text}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Uploading...
                    </>
                  ) : (
                    "Create Quiz"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {quiz.quiz_name}
              </h3>
              <p className="text-blue-600 font-medium text-sm mb-4">
                {quiz.subject.subject_code} - {quiz.subject.subject_name}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-700">
                    {quiz._count.questions}
                  </span>{" "}
                  Items
                </div>
                <div className="flex items-center gap-1 border-l pl-4">
                  <Clock size={14} className="text-gray-400" />
                  <span className="font-semibold text-gray-700">
                    {quiz._count.questions}
                  </span>{" "}
                  Mins
                </div>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500">
                No quizzes found. Create your first one above!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
