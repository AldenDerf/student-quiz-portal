"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  User, 
  Mail, 
  Tag, 
  AlertTriangle,
  X,
  Loader2,
  CheckCircle,
  Filter,
  Users
} from "lucide-react";
import { 
  addStudentAction, 
  updateStudentAction, 
  deleteStudentAction 
} from "@/app/actions/students";

type StudentRecord = {
  id: number;
  studentNum: string;
  firstname: string;
  middlename: string;
  lastname: string;
  gender: string;
  email: string;
  submissionsCount: number;
  enrollments: {
    subjectCode: string;
    section: string;
  }[];
};

type SubjectOption = {
  id: number;
  subjectCode: string;
  subjectName: string;
};

type StudentsClientProps = {
  students: StudentRecord[];
  subjects: SubjectOption[];
};

export default function StudentsClient({ 
  students, 
  subjects 
}: StudentsClientProps) {
  // Navigation & Filtering State
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    subjects[0]?.subjectCode || ""
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Editor Modal State (Add / Update)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  
  // Editor Form Fields
  const [studentNum, setStudentNum] = useState("");
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [email, setEmail] = useState("");
  const [section, setSection] = useState("");

  // Delete Safeguard Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);
  const [deleteVerifyInput, setDeleteVerifyInput] = useState("");

  // UI Status State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Get students enrolled in the active subject
  const enrolledStudents = useMemo(() => {
    return students.filter((std) =>
      std.enrollments.some((e) => e.subjectCode === selectedSubjectCode)
    );
  }, [students, selectedSubjectCode]);

  // 2. Apply search queries
  const filteredStudents = useMemo(() => {
    return enrolledStudents.filter((std) => {
      const fullname = `${std.firstname} ${std.middlename} ${std.lastname}`.toLowerCase();
      const matchesText = 
        fullname.includes(searchQuery.toLowerCase()) ||
        std.studentNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        std.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesText;
    });
  }, [enrolledStudents, searchQuery]);

  // Get current enrollment section for students
  const getStudentSection = (std: StudentRecord) => {
    const enrollment = std.enrollments.find((e) => e.subjectCode === selectedSubjectCode);
    return enrollment?.section || "N/A";
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setStudentNum("");
    setFirstname("");
    setMiddlename("");
    setLastname("");
    setGender("");
    setEmail("");
    setSection("");
    setMessage(null);
    setIsEditorOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setStudentNum(student.studentNum);
    setFirstname(student.firstname);
    setMiddlename(student.middlename || "");
    setLastname(student.lastname);
    setGender(student.gender as any || "");
    setEmail(student.email);
    setSection(student.enrollments.find((e) => e.subjectCode === selectedSubjectCode)?.section || "");
    setMessage(null);
    setIsEditorOpen(true);
  };

  // Handle Form Submit (Add or Update)
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNum || !firstname || !lastname || !email || !selectedSubjectCode) {
      setMessage({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const payload = {
      studentNum,
      firstname,
      middlename,
      lastname,
      gender: gender === "" ? undefined : gender,
      email,
      subjectCode: selectedSubjectCode,
      section: section || undefined,
    };

    try {
      let res;
      if (editingStudent) {
        res = await updateStudentAction(editingStudent.id, payload);
      } else {
        res = await addStudentAction(payload);
      }

      if (res.success) {
        setMessage({
          type: "success",
          text: editingStudent 
            ? "Student details updated successfully!" 
            : "Student added and enrolled successfully!"
        });
        setTimeout(() => {
          setIsEditorOpen(false);
          // Force page refresh of server records
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ type: "error", text: res.error || "An error occurred." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to submit." });
    } finally {
      setLoading(false);
    }
  };

  // Open Delete verification modal
  const handleOpenDelete = (student: StudentRecord) => {
    setDeletingStudent(student);
    setDeleteVerifyInput("");
    setIsDeleteOpen(true);
    setMessage(null);
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingStudent || deleteVerifyInput !== deletingStudent.studentNum) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await deleteStudentAction(deletingStudent.id, deleteVerifyInput);
      if (res.success) {
        setIsDeleteOpen(false);
        // Force refresh
        window.location.reload();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete student." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subject Filter & Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Subject Selection Menu */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Filter size={20} />
          </div>
          <div className="w-full sm:w-72">
            <select
              value={selectedSubjectCode}
              onChange={(e) => {
                setSelectedSubjectCode(e.target.value);
                setSearchQuery("");
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.subjectCode} className="text-gray-800 font-semibold">
                  [{sub.subjectCode}] {sub.subjectName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text Filter Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search student, number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Link
            href="/dashboard/students/import"
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            Bulk Import
          </Link>
          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-100"
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </div>

      {/* Main Student List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">ID Number</th>
                <th className="py-4 px-6">Student Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6 text-center">Gender</th>
                <th className="py-4 px-6 text-center">Section</th>
                <th className="py-4 px-6 text-center">Attempts</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredStudents.map((std) => (
                <tr key={std.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Student ID */}
                  <td className="py-4 px-6 font-mono font-semibold text-gray-900">
                    {std.studentNum}
                  </td>
                  
                  {/* Full Name */}
                  <td className="py-4 px-6">
                    <p className="font-bold text-gray-900">
                      {std.lastname}, {std.firstname} {std.middlename || ""}
                    </p>
                  </td>

                  {/* Email */}
                  <td className="py-4 px-6 text-gray-500 font-medium">
                    {std.email}
                  </td>

                  {/* Gender */}
                  <td className="py-4 px-6 text-center font-semibold text-gray-600 text-xs">
                    {std.gender || "N/A"}
                  </td>

                  {/* Section */}
                  <td className="py-4 px-6 text-center">
                    <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold font-mono border border-slate-200">
                      {getStudentSection(std)}
                    </span>
                  </td>

                  {/* Quiz/Exam Submissions Count */}
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      std.submissionsCount > 0 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-slate-50 text-slate-500 border border-slate-100"
                    }`}>
                      {std.submissionsCount} {std.submissionsCount === 1 ? "attempt" : "attempts"}
                    </span>
                  </td>

                  {/* Action Commands */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(std)}
                        title="Edit Student Info"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(std)}
                        title="Delete Student"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500 bg-gray-50/20">
                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-600">No students enrolled</p>
                    <p className="text-xs text-gray-400 mt-0.5">Enroll your first student by clicking "Add Student" above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD / UPDATE STUDENT FORM */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStudent ? "Edit Student Details" : "Enroll New Student"}
              </h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Student ID Number *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={studentNum}
                    onChange={(e) => setStudentNum(e.target.value)}
                    placeholder="e.g. 2024-001"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Section (e.g. A, B)</label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value.toUpperCase())}
                    placeholder="e.g. A"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Firstname *</label>
                  <input
                    type="text"
                    required
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Middlename</label>
                  <input
                    type="text"
                    value={middlename}
                    onChange={(e) => setMiddlename(e.target.value)}
                    placeholder="Smith"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Lastname *</label>
                  <input
                    type="text"
                    required
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Subject Code Notification Banner */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-gray-500 flex items-center gap-2">
                <Tag size={14} className="text-blue-500" />
                <span>This student will be enrolled in subject <strong>{selectedSubjectCode}</strong>.</span>
              </div>

              {/* Status Message Display */}
              {message && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  message.type === "success" 
                    ? "bg-green-50 text-green-700 border border-green-100" 
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                  {message.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Form Controls */}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {editingStudent ? "Save Updates" : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STRICT DELETE CONFIRMATION SAFEGUARD */}
      {isDeleteOpen && deletingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-5 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-900">Strict Deletion Warning</h2>
                <p className="text-xs text-red-700 font-semibold">Critical safety override required</p>
              </div>
            </div>

            {/* Warning Details Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                You are preparing to delete the student: <strong className="text-gray-900">{deletingStudent.firstname} {deletingStudent.lastname}</strong>.
              </p>

              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 text-xs text-red-800 space-y-2">
                <p className="font-bold">By proceeding, the database will completely delete:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Subject Enrollments (Cascade)</li>
                  <li>All associated Quiz Responses (Cascade)</li>
                  <li>
                    Total of <span className="font-bold">{deletingStudent.submissionsCount}</span> exam & quiz score results (Cascade)
                  </li>
                </ul>
                <p className="font-bold text-[10px] uppercase tracking-wider text-red-600 pt-1">This action cannot be undone.</p>
              </div>

              {/* ID verification entry */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase block">
                  To confirm, type student ID <span className="font-mono text-gray-900 font-extrabold select-all">[{deletingStudent.studentNum}]</span>:
                </label>
                <input
                  type="text"
                  required
                  value={deleteVerifyInput}
                  onChange={(e) => setDeleteVerifyInput(e.target.value)}
                  placeholder="Type ID Number to confirm"
                  className="w-full px-4 py-2 border border-red-200 rounded-xl text-sm font-mono text-red-900 bg-red-50/30 placeholder-red-300 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>

              {/* Status Display */}
              {message && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
                  {message.text}
                </div>
              )}

              {/* Trigger Options */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={loading || deleteVerifyInput !== deletingStudent.studentNum}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-red-100 flex items-center justify-center gap-2 transition-all"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
