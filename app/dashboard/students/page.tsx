import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma/db";
import StudentsClient from "./StudentsClient";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=" + encodeURIComponent("/dashboard/students"));
  }

  if (session.user.role === "student") {
    redirect("/student/portal");
  }

  // Fetch subjects for select menus
  const subjects = await prisma.subject.findMany({
    orderBy: { subject_code: "asc" },
  });

  // Fetch all students with enrollments and result counts
  const students = await prisma.student.findMany({
    include: {
      enrollments: {
        include: {
          subject: true,
        },
      },
      _count: {
        select: {
          exam_results: true,
          quiz_results: true,
        },
      },
    },
    orderBy: { lastname: "asc" },
  });

  // Flat and clean student list
  const cleanedStudents = students.map((std) => ({
    id: std.id,
    studentNum: std.student_num,
    firstname: std.firstname,
    middlename: std.middlename || "",
    lastname: std.lastname,
    gender: std.gender || "",
    email: std.email,
    submissionsCount: std._count.exam_results + std._count.quiz_results,
    enrollments: std.enrollments.map((e) => ({
      subjectCode: e.subject.subject_code,
      section: e.section || "",
    })),
  }));

  const cleanedSubjects = subjects.map((sub) => ({
    id: sub.id,
    subjectCode: sub.subject_code,
    subjectName: sub.subject_name,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Management</h1>
        <p className="text-gray-500 mt-1">Manage subject enrollments, student records, and registrations</p>
      </div>

      <StudentsClient 
        students={cleanedStudents}
        subjects={cleanedSubjects}
      />
    </div>
  );
}
