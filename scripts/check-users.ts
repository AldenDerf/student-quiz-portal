import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../prisma/db";

async function main() {
  const users = await prisma.user.findMany();

  console.log("Found " + users.length + " users in 'users' table:");
  users.forEach((u) => {
    console.log(
      "- [" +
        u.role +
        "] Email: " +
        u.email +
        " | Active: " +
        u.is_active +
        " | Has Password: " +
        !!u.password_hash,
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
