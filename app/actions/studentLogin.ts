"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginStudentAction(studentNum: string) {
  try {
    await signIn("student-login", {
      student_num: studentNum,
      redirectTo: "/student/portal",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          success: false,
          error: "Invalid student number or no active enrollments.",
        };
      }
      return {
        success: false,
        error: "Authentication failed. Please try again.",
      };
    }
    // Next.js redirect relies on throwing NEXT_REDIRECT error
    throw error;
  }
}
