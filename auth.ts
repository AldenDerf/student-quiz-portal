import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "user@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user || !user.password_hash || !user.is_active) {
            console.log("[Auth] User not found or inactive:", email);
            return null;
          }

          const passwordsMatch = await bcrypt.compare(
            password,
            user.password_hash,
          );
          if (passwordsMatch) {
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.fullname,
              role: user.role,
            };
          }
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: "student-login",
      name: "Student Number",
      credentials: {
        student_num: { label: "Student Number", type: "text" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ student_num: z.string().min(1) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const student_num = parsedCredentials.data.student_num.trim();
          console.log(`[Auth] Attempting student login for: ${student_num}`);

          const student = await prisma.student.findUnique({
            where: { student_num },
            include: { enrollments: true },
          });

          // Block if student doesn't exist or has zero valid enrollments
          if (!student) {
            console.warn(`[Auth] Student not found: ${student_num}`);
            return null;
          }
          if (student.enrollments.length === 0) {
            console.warn(
              `[Auth] Student found but has NO enrollments: ${student_num}`,
            );
            return null;
          }

          console.log(
            `[Auth] Login successful for: ${student.firstname} ${student.lastname}`,
          );
          // Format to NextAuth expected interface mapped with student role
          return {
            id: student.id.toString(),
            name: `${student.firstname} ${student.lastname}`,
            email: student.email,
            role: "student",
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as string;
        token.id = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
