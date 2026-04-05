import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";
import * as mariadb from "mariadb";

dotenv.config();

const dbUrlStr = process.env.DATABASE_URL || "mysql://localhost/test";
const dbUrl = new URL(dbUrlStr);

const config = {
  host: decodeURIComponent(dbUrl.hostname),
  port: Number(dbUrl.port) || 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: decodeURIComponent(dbUrl.pathname.substring(1)),
};

const adapter = new PrismaMariaDb(config);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
