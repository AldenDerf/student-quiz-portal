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
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

  // Edit Question Preview State
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionMarks, setEditQuestionMarks] = useState(1);
  const [editOptions, setEditOptions] = useState<{ text: string; is_correct: boolean }[]>([]);

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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setQuizName("");
    setSubjectId("");
    setQuestionsFile(null);
    setParsedQuestions([]);
    setMessage(null);
    setEditingQuestionIdx(null);
  };

  const startEditQuestion = (idx: number) => {
    const q = parsedQuestions[idx];
    setEditingQuestionIdx(idx);
    setEditQuestionText(q.text);
    setEditQuestionMarks(q.marks);
    setEditOptions(q.options.map((opt: any) => ({ ...opt })));
  };

  const handleEditOptionText = (oIdx: number, val: string) => {
    setEditOptions((prev) =>
      prev.map((opt, idx) => (idx === oIdx ? { ...opt, text: val } : opt))
    );
  };

  const handleSelectCorrectOption = (oIdx: number) => {
    setEditOptions((prev) =>
      prev.map((opt, idx) => ({ ...opt, is_correct: idx === oIdx }))
    );
  };

  const saveEditedQuestion = (idx: number) => {
    if (!editQuestionText.trim()) {
      alert("Question text cannot be empty.");
      return;
    }
    if (!editOptions.some((opt) => opt.is_correct)) {
      alert("Please mark at least one option as correct.");
      return;
    }

    setParsedQuestions((prev) =>
      prev.map((q, i) =>
        i === idx
          ? {
              ...q,
              text: editQuestionText,
              marks: editQuestionMarks,
              options: editOptions,
            }
          : q
      )
    );
    setEditingQuestionIdx(null);
  };

  const cancelEditQuestion = () => {
    setEditingQuestionIdx(null);
  };

  const deleteQuestionFromPreview = (idx: number) => {
    if (!confirm("Are you sure you want to remove this question from the upload?")) return;
    setParsedQuestions((prev) => prev.filter((_, i) => i !== idx));
    if (editingQuestionIdx === idx) {
      setEditingQuestionIdx(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setQuestionsFile(file);
    setParsedQuestions([]);
    setMessage(null);

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          throw new Error("JSON must be an array of questions.");
        }

        // Validate question structure
        for (let i = 0; i < json.length; i++) {
          const item = json[i];
          if (!item.text || typeof item.text !== "string") {
            throw new Error(`Question ${i + 1} is missing a 'text' string.`);
          }
          if (item.marks === undefined || typeof item.marks !== "number") {
            throw new Error(`Question ${i + 1} ("${item.text.substring(0, 20)}...") is missing a 'marks' number.`);
          }
          if (!Array.isArray(item.options) || item.options.length === 0) {
            throw new Error(`Question ${i + 1} ("${item.text.substring(0, 20)}...") must have a non-empty 'options' array.`);
          }
          for (let j = 0; j < item.options.length; j++) {
            const opt = item.options[j];
            if (opt.text === undefined) {
              throw new Error(`Option ${j + 1} in Question ${i + 1} is missing 'text'.`);
            }
            if (opt.is_correct === undefined || typeof opt.is_correct !== "boolean") {
              throw new Error(`Option ${j + 1} in Question ${i + 1} is missing an 'is_correct' boolean.`);
            }
          }
        }

        setParsedQuestions(json);
        setMessage(null);
      } catch (err: any) {
        setMessage({
          type: "error",
          text: err.name === "SyntaxError" ? "Invalid JSON file structure." : err.message,
        });
        setQuestionsFile(null);
        setParsedQuestions([]);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizName || !subjectId || parsedQuestions.length === 0) {
      setMessage({
        type: "error",
        text: "Please fill in all fields and select a valid questions file.",
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const result = await uploadQuiz(quizName, parseInt(subjectId), parsedQuestions);

      if (result.success) {
        setMessage({ type: "success", text: "Quiz created successfully!" });
        handleCloseModal();
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
        text: err.message,
      });
    } finally {
      setUploading(false);
    }
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
          <div className={`bg-white rounded-2xl shadow-2xl ${parsedQuestions.length > 0 ? "max-w-4xl" : "max-w-md"} w-full overflow-hidden animate-in fade-in zoom-in duration-200 transition-all`}>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Create New Quiz
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className={`flex flex-col ${parsedQuestions.length > 0 ? "md:flex-row" : ""} divide-y md:divide-y-0 md:divide-x divide-gray-100`}>
              <form onSubmit={handleUpload} className={`p-6 space-y-4 ${parsedQuestions.length > 0 ? "md:w-1/2" : "w-full"}`}>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Quiz Name
                  </label>
                  <input
                    type="text"
                    required
                    value={quizName}
                    onChange={(e) => setQuizName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-600 placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="" className="text-gray-900">Select a subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id} className="text-gray-900">
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
                      onChange={handleFileChange}
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
                    disabled={uploading || parsedQuestions.length === 0}
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

              {/* Preview Section */}
              {parsedQuestions.length > 0 && (
                <div className="md:w-1/2 p-6 bg-gray-50 flex flex-col max-h-[550px]">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <span>Questions Preview</span>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-semibold">
                        {parsedQuestions.length} Items
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full font-semibold">
                        {parsedQuestions.reduce((acc, q) => acc + q.marks, 0)} Pts
                      </span>
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {parsedQuestions.map((q, idx) => {
                      const isEditing = editingQuestionIdx === idx;

                      if (isEditing) {
                        return (
                          <div key={idx} className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-sm space-y-3 text-gray-900 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-blue-600 font-mono">EDITING Q{idx + 1}</span>
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-gray-600">Marks:</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editQuestionMarks}
                                  onChange={(e) => setEditQuestionMarks(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-xs text-gray-900 bg-white font-bold"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-600">Question Text</label>
                              <textarea
                                value={editQuestionText}
                                onChange={(e) => setEditQuestionText(e.target.value)}
                                rows={2}
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-gray-600 flex justify-between">
                                <span>Options</span>
                                <span className="text-[10px] text-gray-400">Select correct one</span>
                              </label>
                              <div className="space-y-1.5">
                                {editOptions.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct-option-${idx}`}
                                      checked={opt.is_correct}
                                      onChange={() => handleSelectCorrectOption(oIdx)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <input
                                      type="text"
                                      required
                                      value={opt.text}
                                      onChange={(e) => handleEditOptionText(oIdx, e.target.value)}
                                      className="flex-1 px-2.5 py-1 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                              <button
                                type="button"
                                onClick={cancelEditQuestion}
                                className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-lg border border-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEditedQuestion(idx)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 text-gray-900">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-gray-400 font-mono">Q{idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {q.marks} {q.marks === 1 ? "mark" : "marks"}
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditQuestion(idx)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteQuestionFromPreview(idx)}
                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 leading-snug">{q.text}</p>
                          <div className="grid grid-cols-1 gap-1.5 pt-1.5">
                            {q.options.map((opt: any, oIdx: number) => (
                              <div
                                key={oIdx}
                                className={`text-xs p-2 rounded-lg border flex items-center justify-between gap-2 ${
                                  opt.is_correct
                                    ? "bg-green-50 border-green-200 text-green-800 font-medium"
                                    : "bg-gray-50 border-gray-100 text-gray-600"
                                }`}
                              >
                                <span>{opt.text}</span>
                                {opt.is_correct && (
                                  <span className="text-[10px] uppercase font-bold bg-green-200 text-green-800 px-1.5 py-0.5 rounded">
                                    Correct
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
