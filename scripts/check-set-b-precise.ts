import { prisma } from "../prisma/db";

async function main() {
  const enrollmentsSetB = await prisma.enrollment.findMany({
    where: {
      section: {
        contains: "B",
      },
    },
    include: {
      student: true,
      subject: true,
    },
  });

  console.log(
    `Found ${enrollmentsSetB.length} enrollments matching section "B":`,
  );
  enrollmentsSetB.forEach((e) => {
    // Print with quotes to catch hidden spaces
    console.log(
      `- ["${e.student.student_num}"] | ${e.student.firstname} ${e.student.lastname} | Section: "${e.section}"`,
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
