"use client";

import { useState, useRef } from "react";
import {
  Loader2,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { importStudentsAction } from "@/app/actions/importStudents";

type Subject = { id: number; subject_code: string; subject_name: string };

type ImportSummary = {
  total: number;
  created: number;
  updated: number;
  enrolled: number;
  alreadyEnrolled: number;
};

type ParsedRow = {
  student_num: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  gender?: "Male" | "Female" | "Other";
  email: string;
  section?: string;
};

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: any = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || "";
      });
      return {
        student_num:
          row["student_num"] || row["studentnum"] || row["student num"],
        firstname: row["firstname"] || row["first_name"] || row["first name"],
        middlename:
          row["middlename"] ||
          row["middle_name"] ||
          row["middle name"] ||
          undefined,
        lastname: row["lastname"] || row["last_name"] || row["last name"],
        gender: (row["gender"] as any) || undefined,
        email: row["email"],
        section: row["section"] || row["set"] || row["exam_set"] || undefined,
      };
    })
    .filter((r) => r.student_num && r.email);
}

export default function StudentImportClient({
  subjects,
}: {
  subjects: Subject[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [subjectCode, setSubjectCode] = useState(
    subjects[0]?.subject_code ?? "",
  );
  const [schoolYear, setSchoolYear] = useState("2025-2026");
  const [semester, setSemester] = useState("Second Semester");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
    summary?: ImportSummary;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
    const text = await selectedFile.text();
    setPreview(parseCSV(text));
  };

  const handleImport = async () => {
    if (!file || !preview.length || !subjectCode) return;
    setLoading(true);
    setResult(null);
    setProgress(0);
    setProgressTotal(preview.length);

    let finalSummary: ImportSummary = {
      total: 0,
      created: 0,
      updated: 0,
      enrolled: 0,
      alreadyEnrolled: 0,
    };
    let isSuccess = true;
    let lastError = "";

    const BATCH_SIZE = 5;
    for (let i = 0; i < preview.length; i += BATCH_SIZE) {
      const batch = preview.slice(i, i + BATCH_SIZE);
      const res = await importStudentsAction(
        batch,
        subjectCode,
        schoolYear,
        semester,
      );

      if (!res.success) {
        isSuccess = false;
        lastError = res.error || "Failed during batch upload.";
        break; // Stop on first error
      }

      if (res.summary) {
        finalSummary.total += res.summary.total;
        finalSummary.created += res.summary.created;
        finalSummary.updated += res.summary.updated;
        finalSummary.enrolled += res.summary.enrolled;
        finalSummary.alreadyEnrolled += res.summary.alreadyEnrolled;
      }

      setProgress(Math.min(i + BATCH_SIZE, preview.length));
    }

    setLoading(false);

    if (isSuccess) {
      setResult({ success: true, summary: finalSummary });
      setFile(null);
      setPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setResult({ success: false, error: lastError });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Import Students</h1>
        <p className="text-zinc-500 mt-1">
          Upload a CSV to bulk-enroll students. Duplicates (by student number)
          will be safely updated, not doubled.
        </p>
      </div>

      {result && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border ${result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {result.success ? (
            <CheckCircle className="mt-0.5 shrink-0" size={20} />
          ) : (
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
          )}
          <div className="flex-1">
            {result.success && result.summary ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                <p className="font-bold text-lg mb-2">
                  Import Finished Successfully! 🎉
                </p>
                <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-lg border border-green-100 mb-4">
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold">
                      Total Processed
                    </p>
                    <p className="text-2xl font-black">
                      {result.summary.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold">
                      New Students
                    </p>
                    <p className="text-2xl font-black">
                      {result.summary.created}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold">
                      Updated Records
                    </p>
                    <p className="text-2xl font-black">
                      {result.summary.updated}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 uppercase font-bold">
                      New Enrollments
                    </p>
                    <p className="text-2xl font-black">
                      {result.summary.enrolled}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="text-sm font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                  Import Another File
                </button>
              </div>
            ) : (
              <p className="font-semibold text-red-700">{result.error}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
              <Upload size={16} /> Upload Settings
            </h2>

            {/* Subject Dropdown — data from DB */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                <option value="" disabled>
                  — Select a subject —
                </option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.subject_code}>
                    {s.subject_code} — {s.subject_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                School Year
              </label>
              <input
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. 2025-2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option>First Semester</option>
                <option>Second Semester</option>
                <option>Summer</option>
              </select>
            </div>

            {/* CSV Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                CSV File <span className="text-red-500">*</span>
              </label>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-50 hover:border-indigo-400 transition-colors">
                <FileText size={24} className="text-zinc-400 mb-1" />
                <span className="text-xs text-zinc-500">
                  {file ? file.name : "Click to upload .csv"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {loading ? (
              <div className="w-full bg-zinc-50 border border-indigo-100 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-indigo-700 mb-3 flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Importing {progress} of {progressTotal} students...
                </p>
                <div className="w-full bg-indigo-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.max(5, (progress / progressTotal) * 100)}%`,
                    }}></div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleImport}
                disabled={!file || !subjectCode || preview.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-40 transition-colors">
                <Upload size={18} /> Import {preview.length} Students
              </button>
            )}
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800">
            <p className="font-semibold mb-2">📋 Required CSV Format:</p>
            <code className="text-xs block bg-white rounded p-2 border border-indigo-200 overflow-x-auto whitespace-nowrap">
              student_num,firstname,middlename,lastname,gender,email,section
            </code>
            <p className="mt-2 text-xs text-indigo-600">
              <strong>section</strong> = A or B. middlename & gender are
              optional.
            </p>
          </div>
        </div>

        {/* Preview Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="font-semibold text-zinc-800">
                Preview ({preview.length} rows)
              </h2>
              {preview.length > 0 && (
                <button
                  onClick={() => {
                    setPreview([]);
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                  <X size={14} /> Clear
                </button>
              )}
            </div>

            {preview.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                <FileText size={36} className="mx-auto mb-3 opacity-40" />
                <p>
                  Upload a CSV file to preview the student data before
                  importing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Student No.</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Section</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                        <td className="px-4 py-3 font-mono font-medium text-zinc-900">
                          {row.student_num}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {row.firstname}{" "}
                          {row.middlename ? row.middlename + " " : ""}
                          {row.lastname}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{row.email}</td>
                        <td className="px-4 py-3">
                          {row.section ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                              Set {row.section}
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
