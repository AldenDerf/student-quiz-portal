import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/prisma/db";
import StudentImportClient from "./StudentImportClient";

export default async function StudentImportPage() {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "admin" && session.user.role !== "exam_creator")
  ) {
    redirect("/dashboard");
  }

  const subjects = await prisma.subject.findMany({
    orderBy: { subject_code: "asc" },
    select: { id: true, subject_code: true, subject_name: true },
  });

  return <StudentImportClient subjects={subjects} />;
}
