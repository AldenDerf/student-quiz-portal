# 🤖 AI Agent Skills & Context

When working on this codebase, AI agents should utilize the following skills and patterns:

## 1. Next.js App Router (v16+)
- Default to **Server Components** (`page.tsx`, `layout.tsx`) for data fetching.
- Use `"use client"` directives ONLY at the very top of files that require interactivity (hooks like `useState`, `useEffect`, or event listeners).
- Leverage **Server Actions** (`"use server"`) for data mutations and form submissions.

## 2. Prisma & Database Management
- Always import the initialized Prisma client from `/prisma/db.ts` to prevent multiple connection instances during development.
- Handle relational queries carefully using `include` or `select` to avoid N+1 query problems.
- Respect the strict rule: **never reset the database (`prisma migrate reset`)**.

## 3. Auth.js (NextAuth v5 Beta)
- Import authentication utilities (`auth`, `signIn`, `signOut`) directly from `/auth.ts`.
- Authenticate server-side using `await auth()` in Server Components and Server Actions.
- Enforce Role-Based Access Control (RBAC) by checking `session.user.role` (e.g., `admin`, `exam_creator`, `student`).

## 4. Tailwind CSS v4 & UI
- Utilize Tailwind CSS v4 utilities for styling.
- Prioritize clean, responsive designs.
- Use `lucide-react` for consistent iconography.

## 5. Version Control (Git)
- ALWAYS run `git add .` and `git commit -m "..."` whenever you finish implementing changes or complete a task in `task.md`. Keep commits atomic and messages descriptive.

