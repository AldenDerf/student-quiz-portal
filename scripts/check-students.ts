import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    include: {
      enrollments: true,
    },
  });

  console.log("Found " + students.length + " students:");
  students.forEach((s) => {
    console.log(
      "- [" +
        s.student_num +
        "] " +
        s.firstname +
        " " +
        s.lastname +
        " (Enrollments: " +
        s.enrollments.length +
        ")",
    );
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
