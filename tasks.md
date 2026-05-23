# 📋 Task List: Student Grade View Feature

## Objective
Implement a secure, mobile-responsive page where students can view their semester grades and GPA summary.

## Todo Items
- [ ] Create a local error boundary (`error.tsx`) inside `/app/dashboard/grades/` to catch database connection drops safely.
- [ ] Implement `page.tsx` as a Server Component fetching records directly via the Prisma client located in `/prisma/db.ts`.
- [ ] Implement strict data scrubbing: use Prisma's `select` property to query only `courseCode`, `courseName`, `grade`, and `remarks`. Do not return internal database flags.
- [ ] Build the UI layout using Tailwind CSS v4 responsive grid columns (`grid-cols-1 md:grid-cols-3`) with an `animate-pulse` state for initial component rendering.
- [ ] Verify that the user session role is explicitly checked (`session.user.role === 'student'`) before data resolution.