# Student Quiz Portal

A modern web application built with Next.js for managing and taking student quizzes and exams.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, v16+)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database Provider**: MySQL / TiDB
- **Authentication**: [Auth.js (NextAuth v5 beta)](https://authjs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Language**: TypeScript

## 📂 Project Structure

- `/app`: Next.js App Router pages and API routes.
- `/components`: Reusable UI components.
- `/prisma`: Prisma schema (`schema.prisma`) and database client configuration.
- `/types`: Custom TypeScript type definitions.
- `auth.ts`: Configuration for NextAuth, defining credential providers for `Users` (staff/admin) and `Students`.

## 🗄️ Database Schema Overview

The database models are structured to support both traditional exams and quizzes:
- **Core Entities**: `Subject`, `Student`, `AcademicTerm`, `Enrollment`, `User` (staff).
- **Assessments**: `Exam` & `Quiz` models, linked to `Subject` and created by a `User`.
- **Questions**: `Question` (for Exams) and `QuizQuestion` (for Quizzes) with their respective options.
- **Results**: Tracks `ExamResult`, `QuizResult`, and individual `QuizResponse` for detailed analytics.

## 🔐 Authentication

The application uses two primary credential providers:
1. **Users/Staff**: Logs in using `email` and `password`. Roles include `admin`, `exam_creator`, and `exporter`.
2. **Students**: Logs in using their unique `student_num`. A student must have valid enrollments to successfully log in.

## ⚠️ Important AI Agent Rules (from `AGENTS.md`)

When an AI assistant or agent is modifying this codebase, it MUST adhere to the following strict rules:
- **This is a specialized Next.js version**: It has breaking changes compared to typical Next.js training data. Refer to `node_modules/next/dist/docs/` for specific version guidance.
- **Data Preservation**:
  - **DO NOT** reset the database.
  - **DO NOT** delete build data or files.

## 🛠️ Local Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
