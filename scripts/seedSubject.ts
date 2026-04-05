import { prisma } from "../prisma/db";

async function main() {
  const subject = await prisma.subject.upsert({
    where: { subject_code: "ITE-207" },
    update: { subject_name: "Web Systems and Technologies 1" },
    create: {
      subject_code: "ITE-207",
      subject_name: "Web Systems and Technologies 1",
    },
  });
  console.log(
    "✓ Subject created/verified:",
    subject.subject_code,
    "-",
    subject.subject_name,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
