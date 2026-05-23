---
name: student-portal-full-spec
description: Core security overrides, UX/UI guidelines, and strict Next.js App Router engineering standards for the Student Portal.
---

# 🤖 AI Agent Skills & Context: Student Portal System

When working on this codebase, AI agents must strictly adhere to these specific student portal architecture patterns, critical security overrides, and Next.js execution standards.

> ⚠️ **CRITICAL CONTEXT:** This project runs on Next.js 15+ App Router, Prisma, Auth.js v5, and Tailwind v4. Do not use Pages Router conventions (`/pages` directory, `getServerSideProps`, or `getStaticProps`).

---

## 🛡️ CRITICAL SECURITY & ACCESS OVERRIDES

1. **Zero-Trust Client Components:** Assume the client browser is completely compromised. **NEVER** import `prisma` or write database queries inside `'use client'` files. Use `server-only` as a hard boundary.
2. **Server Action Shield (Mandatory Auth):** Every Server Action is a public API endpoint. It **MUST** implement:
   - **Input Validation:** Enforce strict data schemas via Zod.
   - **Identity Verification:** Fetch the current user via `await auth()`. Reject unauthenticated requests immediately.
   - **Data Ownership / RBAC:** Verify that a `student` can only query/mutate their own records (e.g., matching `session.user.id`). For staff actions (e.g., grading, updating courses), explicitly verify `session.user.role === 'admin'` or `'exam_creator'`.
3. **Data Scrubbing (No Leakage):** Never return raw database row objects to the client. Explicitly use Prisma's `select` to filter fields. **Never leak password hashes, internal metadata, or raw exam answer keys** to the frontend.
4. **Data Preservation:** **NEVER** run accidental bulk deletions (e.g., `deleteMany({})`) or reset tables. Database resets (`prisma migrate reset`) are strictly banned. Always use `upsert` or target specific records by explicit IDs to preserve student grades, users, and enrollment histories.

---

## 🎨 UX/UI & DASHBOARD DESIGN PRINCIPLES (Tailwind v4)

- **Visual Hierarchy & Progressive Disclosure:** High-level metrics cards (GPA, Enrolled Courses) at the top. Complex details/tables further down.
- **Mobile-First Responsive Grids:** Portals must scale effortlessly. Use grid structures that stack smoothly on small viewports (e.g., `grid grid-cols-1 md:grid-cols-3 gap-6`).
- **Semantic States & Feedback:** Clickable items must have hover/active states (`hover:bg-*`, `active:scale-[0.98]`). Use `Success (Green)` for submitted items, `Warning (Amber)` for deadlines, and `Error (Red)` for validation failures. Provide `animate-pulse` skeletons for loading states.

---

## 🛠️ NEXT.JS CORE ENGINEERING STANDARDS

### 1. Project Structure, Layouts, & Pages

- Follow the App Router structure inside the `/app` directory.
- Use `layout.tsx` for persistent shared UI components (e.g., the student sidebar or admin navigation header) to avoid unnecessary re-renders.
- Use `page.tsx` strictly for layout content components.

### 2. Linking & Navigating

- **Client Navigation:** Always use the Next.js `<Link>` component from `next/link` for internal system navigation to enable prefetching and single-page routing.
- **Programmatic Navigation:** Use `useRouter()` from `next/navigation` strictly inside Client Components when action-triggered navigation is required.

### 3. Server vs. Client Components

- Default all components to **Server Components** to keep data fetching close to the source and maintain zero client-side JavaScript overhead.
- Use `"use client"` **ONLY** when DOM interactions, event listeners, or client-side hooks (`useState`, `useEffect`) are technically required (e.g., reactive quiz timers or interactive modal toggles).

### 4. Data Fetching, Caching, & Revalidating

- **Fetching:** Fetch data directly inside async Server Components via standard async/await operations or Prisma queries.
- **Caching & Revalidation:** - For dynamic dashboard items like grades or active quiz data, bypass static caching or use low revalidation periods using `revalidatePath('/dashboard/grades')` immediately after a mutation occurs inside a Server Action.
  - Utilize Next.js dynamic routing configurations (`export const dynamic = 'force-dynamic'`) on pages requiring real-time, zero-cached consistency.

### 5. Data Mutations (Server Actions)

- Execute all student and creator data updates inside dedicated `"use server"` functional actions.
- Always return a standard status schema object to the client components (e.g., `{ success: true, data: ... }` or `{ success: false, error: ... }`).

### 6. Error Handling

- Create local `error.tsx` boundary files at logical route segment levels to catch runtime exceptions gracefully without breaking the wider dashboard layout.
- Provide clean fallback error cards containing an explicit "Try Again" recovery action button.
- Utilize `not-found.tsx` for missing dynamic resources (e.g., an invalid course ID query).

### 7. Global CSS, Fonts, & Image Optimization

- **CSS:** Centralize all base core styling configurations inside `/app/globals.css` using clean Tailwind v4 setup rules.
- **Images:** Always render system imagery (e.g., student avatars, institution logos) through the `<Image />` component from `next/image` to force modern format encoding, automatic sizing layout protection, and lazy loading.
- **Fonts:** Keep typography performance optimized by loading required fonts through `next/font/google`.

### 8. Metadata & Open Graph (OG) Images

- Declare static or dynamic SEO/Portal page configuration details using the `export const metadata: Metadata` schema definition inside layout or page scopes.
- Ensure the student login and marketing splash screens contain complete title and description context properties.

### 9. Route Handlers

- Use Route Handlers (`route.ts`) **ONLY** for non-UI API functionalities, such as automated system webhooks, document exports (e.g., downloading a PDF transcript), or file ingest pipelines.
- Protect all Route Handlers with the exact same _Server Action Shield_ session check logic to prevent unauthorized external access.

---

### 5. Version Control & Task Tracking (Git)

- **ALWAYS** run `git add .` and `git commit -m "..."` whenever you finish implementing changes or complete an item in `task.md`. Keep commits atomic, clean, and messages descriptive of what portal feature was updated.
