import { prisma } from "../prisma/db";
import bcrypt from "bcryptjs";

async function main() {
  const email = "teacher@quiz.com";
  const password = "admin";
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`User ${email} not found. Please run the seed script first.`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: {
      password_hash: hashedPassword,
    },
  });

  console.log(
    `Successfully updated password for ${email}. You can now login with:`,
  );
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
