import { prisma } from "../prisma/db";

async function main() {
  const existing = await prisma.academicTerm.findFirst({
    where: { school_year: "2025-2026", semester: "Second Semester" },
  });

  if (!existing) {
    const term = await prisma.academicTerm.create({
      data: { school_year: "2025-2026", semester: "Second Semester" },
    });
    console.log(
      "✓ Created:",
      term.school_year,
      term.semester,
      `(id: ${term.id})`,
    );
  } else {
    console.log(
      "✓ Already exists:",
      existing.school_year,
      existing.semester,
      `(id: ${existing.id})`,
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
