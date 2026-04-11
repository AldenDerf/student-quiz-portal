const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  console.log("Checking user count...");
  try {
    const count = await prisma.user.count();
    console.log("SUCCESS: User count is:", count);
    if (count === 0) {
      console.log("DATABASE IS EMPTY! You must run the seed script.");
    }
  } catch (err) {
    console.error("CONNECTION FAILED:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
