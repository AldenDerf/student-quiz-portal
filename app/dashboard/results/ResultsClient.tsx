"use client";

import { useState, useMemo } from "react";
import { 
  BookOpen, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  Search,
  ChevronRight,
  FolderOpen,
  FileText,
  HelpCircle,
  ArrowLeft,
  Users
} from "lucide-react";

type AssessmentResult = {
  id: number;
  studentId: number;
  studentNum: string;
  studentName: string;
  studentEmail: string;
  examId?: number;
  quizId?: number;
  examName?: string;
  quizName?: string;
  totalMarks: number;
  subjectCode: string;
  subjectName: string;
  score: number;
  percentage: number;
  takenAt: string;
};

type SubjectOption = {
  id: number;
  subjectCode: string;
  subjectName: string;
};

type AssessmentMaster = {
  id: number;
  examName?: string;
  quizName?: string;
  totalMarks: number;
  subjectCode: string;
  subjectName: string;
  type?: string;
};

type ResultsClientProps = {
  examResults: AssessmentResult[];
  quizResults: AssessmentResult[];
  subjects: SubjectOption[];
  exams: AssessmentMaster[];
  quizzes: AssessmentMaster[];
};

type ViewState = "subjects" | "branching" | "assessment-list" | "results-table";

export default function ResultsClient({ 
  examResults, 
  quizResults, 
  subjects,
  exams,
  quizzes
}: ResultsClientProps) {
  // Navigation States
  const [viewState, setViewState] = useState<ViewState>("subjects");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>("");
  const [selectedSet, setSelectedSet] = useState<"A" | "B" | null>(null);
  const [selectedType, setSelectedType] = useState<"exam" | "quiz" | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [selectedAssessmentName, setSelectedAssessmentName] = useState<string | null>(null);
  const [selectedAssessmentTotal, setSelectedAssessmentTotal] = useState<number | null>(null);

  // Table Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to fetch details about selected subject
  const currentSubject = useMemo(() => {
    return subjects.find((s) => s.subjectCode === selectedSubjectCode);
  }, [selectedSubjectCode, subjects]);

  // Step 1: Group all exams/quizzes under the selected subject
  const selectedSubjectExamsAndQuizzes = useMemo(() => {
    if (!selectedSubjectCode) return { exams: [], quizzes: [], all: [] };
    const subExams = exams.filter((e) => e.subjectCode === selectedSubjectCode);
    const subQuizzes = quizzes.filter((q) => q.subjectCode === selectedSubjectCode);
    return {
      exams: subExams,
      quizzes: subQuizzes,
      all: [
        ...subExams.map((e) => ({ ...e, type: "exam" })),
        ...subQuizzes.map((q) => ({ ...q, type: "quiz" }))
      ]
    };
  }, [selectedSubjectCode, exams, quizzes]);

  // Step 2: Determine if this subject has Set A and Set B assessments
  const hasSetAB = useMemo(() => {
    const list = selectedSubjectExamsAndQuizzes.all;
    return list.some((item) => {
      const name = (item.examName || item.quizName || "").toLowerCase();
      return name.includes("set a") || name.includes("set b");
    });
  }, [selectedSubjectExamsAndQuizzes]);

  // Step 3: Filter the assessments to list based on the chosen path (Set A/B OR Exam/Quiz)
  const listAssessments = useMemo(() => {
    const { exams: subExams, quizzes: subQuizzes, all: subAll } = selectedSubjectExamsAndQuizzes;
    
    if (selectedSet) {
      // Show both exams and quizzes matching the selected set
      return subAll.filter((item) => {
        const name = (item.examName || item.quizName || "").toLowerCase();
        return name.includes(`set ${selectedSet.toLowerCase()}`);
      });
    }

    if (selectedType === "exam") {
      return subExams;
    }

    if (selectedType === "quiz") {
      return subQuizzes;
    }

    return [];
  }, [selectedSubjectExamsAndQuizzes, selectedSet, selectedType]);

  // Step 4: Get submissions for the selected specific assessment
  const submissionResults = useMemo(() => {
    if (!selectedAssessmentId) return [];

    const isExam = selectedType === "exam" || (selectedSet && listAssessments.find((a) => a.id === selectedAssessmentId)?.type === "exam");
    const results = isExam ? examResults : quizResults;

    return results.filter((r) => {
      if (isExam) {
        return r.examId === selectedAssessmentId;
      } else {
        return r.quizId === selectedAssessmentId;
      }
    });
  }, [selectedAssessmentId, selectedType, selectedSet, listAssessments, examResults, quizResults]);

  // Step 5: Apply text search over submissions
  const filteredSubmissions = useMemo(() => {
    return submissionResults.filter((s) => {
      return (
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentNum.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [submissionResults, searchQuery]);

  // Metrics calculations for the final selection
  const stats = useMemo(() => {
    const total = filteredSubmissions.length;
    if (total === 0) {
      return { total: 0, average: 0, passRate: 0, highest: 0 };
    }

    const sumPercent = filteredSubmissions.reduce((acc, item) => acc + item.percentage, 0);
    const average = (sumPercent / total).toFixed(1);

    const passingCount = filteredSubmissions.filter((item) => item.percentage >= 60).length;
    const passRate = ((passingCount / total) * 100).toFixed(1);

    const highest = Math.max(...filteredSubmissions.map((item) => item.percentage)).toFixed(1);

    return { total, average, passRate, highest };
  }, [filteredSubmissions]);

  // Navigation handlers
  const handleSelectSubject = (subjectCode: string) => {
    setSelectedSubjectCode(subjectCode);
    setSelectedSet(null);
    setSelectedType(null);
    setSelectedAssessmentId(null);
    setSearchQuery("");
    setViewState("branching");
  };

  const handleSelectSet = (set: "A" | "B") => {
    setSelectedSet(set);
    setSelectedType(null);
    setSelectedAssessmentId(null);
    setViewState("assessment-list");
  };

  const handleSelectType = (type: "exam" | "quiz") => {
    setSelectedSet(null);
    setSelectedType(type);
    setSelectedAssessmentId(null);
    setViewState("assessment-list");
  };

  const handleSelectAssessment = (id: number, name: string, totalMarks: number) => {
    setSelectedAssessmentId(id);
    setSelectedAssessmentName(name);
    setSelectedAssessmentTotal(totalMarks);
    setViewState("results-table");
  };

  // Date Formatter
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  // Breadcrumbs Navigation Action
  const renderBreadcrumbs = () => {
    return (
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-6 bg-white p-3 rounded-lg border border-gray-200 shadow-sm overflow-x-auto whitespace-nowrap">
        <button 
          onClick={() => {
            setViewState("subjects");
            setSelectedSubjectCode("");
          }}
          className="hover:text-blue-600 transition-colors"
        >
          Subjects
        </button>
        
        {selectedSubjectCode && (
          <>
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
            <button 
              onClick={() => {
                setViewState("branching");
                setSelectedSet(null);
                setSelectedType(null);
                setSelectedAssessmentId(null);
              }}
              className="hover:text-blue-600 transition-colors"
            >
              {selectedSubjectCode}
            </button>
          </>
        )}

        {(selectedSet || selectedType) && (
          <>
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
            <button 
              onClick={() => {
                setViewState("assessment-list");
                setSelectedAssessmentId(null);
              }}
              className="hover:text-blue-600 transition-colors"
            >
              {selectedSet ? `Set ${selectedSet}` : selectedType === "exam" ? "Exams" : "Quizzes"}
            </button>
          </>
        )}

        {selectedAssessmentId && (
          <>
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-800 truncate max-w-[200px]">
              {selectedAssessmentName}
            </span>
          </>
        )}
      </nav>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Breadcrumbs */}
      {viewState !== "subjects" && renderBreadcrumbs()}

      {/* STATE 1: SUBJECT SELECTION */}
      {viewState === "subjects" && (
        <div className="space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <h2 className="text-lg font-bold text-gray-800">Select a Subject</h2>
            <p className="text-xs text-gray-400">Choose a course to track student assessment performances</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => {
              // Count total exams/quizzes under this subject
              const totalExams = exams.filter((e) => e.subjectCode === sub.subjectCode).length;
              const totalQuizzes = quizzes.filter((q) => q.subjectCode === sub.subjectCode).length;

              return (
                <button
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub.subjectCode)}
                  className="bg-white p-6 rounded-2xl border border-gray-200 text-left hover:border-blue-500 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  
                  <span className="inline-block px-2.5 py-1 text-xs font-extrabold font-mono bg-blue-50 text-blue-700 rounded-lg mb-3">
                    {sub.subjectCode}
                  </span>
                  
                  <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors mb-4">
                    {sub.subjectName}
                  </h3>

                  <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 pt-3 border-t border-gray-50">
                    <span className="flex items-center gap-1">
                      <FileText size={14} className="text-gray-400" />
                      {totalExams} {totalExams === 1 ? "Exam" : "Exams"}
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle size={14} className="text-gray-400" />
                      {totalQuizzes} {totalQuizzes === 1 ? "Quiz" : "Quizzes"}
                    </span>
                  </div>
                </button>
              );
            })}

            {subjects.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500 font-semibold">No subjects found in the database</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATE 2: SETS OR EXAMS/QUIZZES BRANCHING */}
      {viewState === "branching" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setViewState("subjects");
                setSelectedSubjectCode("");
              }}
              className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentSubject?.subjectName}</h2>
              <p className="text-xs text-gray-500">Subject Menu Options</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-8 text-center">
            {hasSetAB ? (
              <>
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-700 animate-pulse">
                    Set A / B Configured
                  </span>
                  <h3 className="text-2xl font-bold text-gray-800">Select Exam Set</h3>
                  <p className="text-sm text-gray-500">This subject contains Set A and Set B assessments. Choose a set to continue.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-4">
                  <button
                    onClick={() => handleSelectSet("A")}
                    className="p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-center font-bold text-gray-800 text-lg hover:text-blue-600 transition-all flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-extrabold">A</div>
                    Set A Results
                  </button>
                  <button
                    onClick={() => handleSelectSet("B")}
                    className="p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-center font-bold text-gray-800 text-lg hover:text-blue-600 transition-all flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-extrabold">B</div>
                    Set B Results
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-800">Choose Assessment Type</h3>
                  <p className="text-sm text-gray-500">Select a category below to explore individual quizzes or exams.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-4">
                  <button
                    onClick={() => handleSelectType("exam")}
                    className="p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-center font-bold text-gray-800 text-lg hover:text-blue-600 transition-all flex flex-col items-center gap-2"
                  >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <FileText size={28} />
                    </div>
                    Exams
                  </button>
                  <button
                    onClick={() => handleSelectType("quiz")}
                    className="p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-center font-bold text-gray-800 text-lg hover:text-blue-600 transition-all flex flex-col items-center gap-2"
                  >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <HelpCircle size={28} />
                    </div>
                    Quizzes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* STATE 3: ASSESSMENT LISTS */}
      {viewState === "assessment-list" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedSet ? `Set ${selectedSet} Assessments` : selectedType === "exam" ? "Exams List" : "Quizzes List"}
              </h2>
              <p className="text-xs text-gray-400">Click a specific title below to view the students grades and results</p>
            </div>
            <button
              onClick={() => {
                setViewState("branching");
                setSelectedSet(null);
                setSelectedType(null);
              }}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              &larr; Back to Options
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listAssessments.map((assessment) => {
              const name = assessment.examName || assessment.quizName || "";
              
              // Count submissions for this specific assessment
              const subCount = (assessment.examName ? examResults : quizResults).filter(
                (r) => (assessment.examName ? r.examId === assessment.id : r.quizId === assessment.id)
              ).length;

              return (
                <button
                  key={assessment.id}
                  onClick={() => handleSelectAssessment(assessment.id, name, assessment.totalMarks)}
                  className="bg-white p-5 rounded-2xl border border-gray-200 text-left hover:border-blue-500 hover:shadow-sm transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {name}
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold">
                      Total Marks: <span className="text-gray-700">{assessment.totalMarks}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold font-mono">
                      {subCount} {subCount === 1 ? "submission" : "submissions"}
                    </span>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </button>
              );
            })}

            {listAssessments.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500 font-semibold">No assessments found for this selection</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATE 4: SUBMISSIONS AND GRADES TABLE */}
      {viewState === "results-table" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 text-xs font-extrabold font-mono bg-blue-50 text-blue-700 rounded-lg mb-1">
                {selectedSubjectCode}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {selectedAssessmentName}
              </h2>
            </div>
            
            <button
              onClick={() => {
                setViewState("assessment-list");
                setSelectedAssessmentId(null);
              }}
              className="text-xs font-bold text-blue-600 hover:underline sm:self-center self-start"
            >
              &larr; Back to Assessment List
            </button>
          </div>

          {/* Assessment-specific statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submissions</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Score</p>
                <p className="text-2xl font-bold text-gray-800">{stats.average}%</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pass Rate (≥60%)</p>
                <p className="text-2xl font-bold text-gray-800">{stats.passRate}%</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Highest Score</p>
                <p className="text-2xl font-bold text-gray-800">{stats.highest}%</p>
              </div>
            </div>
          </div>

          {/* Search box for this list */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search student or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Student Submissions List Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Student</th>
                    <th className="py-4 px-6 text-center">Score</th>
                    <th className="py-4 px-6 text-center">Percentage</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredSubmissions.map((result) => {
                    const isPassing = result.percentage >= 60;
                    return (
                      <tr key={result.id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Student Details */}
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-bold text-gray-900">{result.studentName}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{result.studentNum}</p>
                          </div>
                        </td>

                        {/* Marks */}
                        <td className="py-4 px-6 text-center font-mono font-semibold">
                          {result.score} <span className="text-gray-400 text-xs font-normal">/ {selectedAssessmentTotal}</span>
                        </td>

                        {/* Percentage */}
                        <td className={`py-4 px-6 text-center font-mono font-bold ${
                          isPassing ? "text-emerald-600" : "text-rose-500"
                        }`}>
                          {result.percentage.toFixed(1)}%
                        </td>

                        {/* Pass/Fail Status */}
                        <td className="py-4 px-6">
                          {isPassing ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 size={12} />
                              Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                              <XCircle size={12} />
                              Fail
                            </span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-4 px-6 text-gray-500 text-xs whitespace-nowrap flex items-center gap-2 mt-2 border-transparent">
                          <Calendar size={14} className="text-gray-400" />
                          {formatDate(result.takenAt)}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500 bg-gray-50/30">
                        <p className="text-base font-semibold text-gray-600 mb-1">No submissions recorded</p>
                        <p className="text-xs text-gray-400">No students have taken this assessment matching the query.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
