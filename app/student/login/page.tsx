"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { loginStudentAction } from "@/app/actions/studentLogin";

export default function StudentLogin() {
  const [studentNum, setStudentNum] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginStudentAction(studentNum);

      // result will only be returned if an error was caught.
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err: any) {
      // In Next.js, redirects from server actions are thrown as special errors.
      // We should only stop loading if it's NOT a redirect.
      if (err.digest?.startsWith("NEXT_REDIRECT")) {
        return;
      }
      console.error("Login component error:", err);
      setError("An unexpected error occurred during sign in.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900">
          Student Exam Portal
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Enter your student number to access your active exams.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-200">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="student_num"
                className="block text-sm font-medium text-zinc-700">
                Student Number
              </label>
              <div className="mt-1">
                <input
                  id="student_num"
                  name="student_num"
                  type="text"
                  required
                  value={studentNum}
                  onChange={(e) => setStudentNum(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. 2024-00123"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Authenticating...
                  </>
                ) : (
                  "Access Exams"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
