"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  BookOpen, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  Filter,
  RefreshCw
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

type ResultsClientProps = {
  examResults: AssessmentResult[];
  quizResults: AssessmentResult[];
  subjects: SubjectOption[];
};

export default function ResultsClient({ 
  examResults, 
  quizResults, 
  subjects 
}: ResultsClientProps) {
  const [activeTab, setActiveTab] = useState<"exams" | "quizzes">("exams");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const currentData = activeTab === "exams" ? examResults : quizResults;

  // Filter Data in real-time
  const filteredData = useMemo(() => {
    return currentData.filter((item) => {
      const matchesSearch = 
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.studentNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.examName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.quizName || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSubject = selectedSubject === "" || item.subjectCode === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  }, [currentData, searchQuery, selectedSubject]);

  // Metric computations for the currently viewed dataset
  const stats = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) {
      return { total: 0, average: 0, passRate: 0, highest: 0 };
    }

    const sumPercent = filteredData.reduce((acc, item) => acc + item.percentage, 0);
    const average = (sumPercent / total).toFixed(1);

    const passingCount = filteredData.filter((item) => item.percentage >= 60).length;
    const passRate = ((passingCount / total) * 100).toFixed(1);

    const highest = Math.max(...filteredData.map((item) => item.percentage)).toFixed(1);

    return { total, average, passRate, highest };
  }, [filteredData]);

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

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSubject("");
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("exams");
            handleResetFilters();
          }}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "exams"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Exam Results
        </button>
        <button
          onClick={() => {
            setActiveTab("quizzes");
            handleResetFilters();
          }}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "quizzes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Quiz Results
        </button>
      </div>

      {/* Analytics/Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <BookOpen size={24} />
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search student, number, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filters and Reset */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg w-full sm:w-auto">
            <Filter size={16} className="text-gray-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none pr-6 cursor-pointer w-full"
            >
              <option value="" className="text-gray-800">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.subjectCode} className="text-gray-800">
                  {s.subjectCode} - {s.subjectName}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery !== "" || selectedSubject !== "") && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full sm:w-auto justify-center"
            >
              <RefreshCw size={12} />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">Student</th>
                <th className="py-4 px-6">Subject</th>
                <th className="py-4 px-6">{activeTab === "exams" ? "Exam Title" : "Quiz Title"}</th>
                <th className="py-4 px-6 text-center">Score</th>
                <th className="py-4 px-6 text-center">Percentage</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredData.map((result) => {
                const isPassing = result.percentage >= 60;
                return (
                  <tr key={result.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Student Info */}
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-gray-900">{result.studentName}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{result.studentNum}</p>
                      </div>
                    </td>

                    {/* Subject Info */}
                    <td className="py-4 px-6">
                      <div>
                        <span className="inline-block px-2 py-0.5 text-xs font-bold font-mono bg-slate-100 text-slate-700 rounded mb-0.5">
                          {result.subjectCode}
                        </span>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{result.subjectName}</p>
                      </div>
                    </td>

                    {/* Assessment Name */}
                    <td className="py-4 px-6 font-medium text-gray-800">
                      {activeTab === "exams" ? result.examName : result.quizName}
                    </td>

                    {/* Raw Score */}
                    <td className="py-4 px-6 text-center font-mono font-semibold">
                      {result.score} <span className="text-gray-400 text-xs font-normal">/ {result.totalMarks}</span>
                    </td>

                    {/* Percentage */}
                    <td className={`py-4 px-6 text-center font-mono font-bold ${
                      isPassing ? "text-emerald-600" : "text-rose-500"
                    }`}>
                      {result.percentage.toFixed(1)}%
                    </td>

                    {/* Pass/Fail Status Badge */}
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

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 bg-gray-50/30">
                    <p className="text-base font-semibold text-gray-600 mb-1">No results found</p>
                    <p className="text-xs text-gray-400">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
