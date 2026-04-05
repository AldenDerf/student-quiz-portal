import { prisma } from "../prisma/db";

async function main() {
  const subject = await prisma.subject.findUnique({
    where: { subject_code: "ITE-207" },
  });
  if (!subject) {
    console.error("Subject ITE-207 not found!");
    return;
  }

  const exam = await prisma.exam.upsert({
    where: { id: 2 }, // Using a fixed ID if we want or just creating a new one
    update: {
      exam_name: "ITE-207 Midterm Exam (CSS Mastery)",
      total_marks: 50,
    },
    create: {
      subject_id: subject.id,
      creator_id: 1, // Using Alden (ID: 1)
      exam_name: "ITE-207 Midterm Exam (CSS Mastery)",
      total_marks: 50,
    },
  });

  console.log("ITE-207 Midterm Exam created/verified with ID:", exam.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
