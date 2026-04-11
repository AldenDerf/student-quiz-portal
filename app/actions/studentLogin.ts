"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginStudentAction(studentNum: string) {
  console.log(`[Action] Attempting student login for: ${studentNum}`);
  try {
    const result = await signIn("student-login", {
      student_num: studentNum,
      redirectTo: "/student/portal",
      redirect: true,
    });
    console.log(`[Action] SignIn result:`, result);
    return result;
  } catch (error) {
    if (error instanceof AuthError) {
      console.error(`[Action] AuthError:`, error.type);
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
    if ((error as any).digest?.startsWith("NEXT_REDIRECT")) {
      console.log(`[Action] Success, redirecting...`);
      throw error;
    }
    console.error(`[Action] Unexpected Error:`, error);
    throw error;
  }
}
