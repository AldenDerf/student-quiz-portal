require("dotenv").config();
console.log("--- ENV DIAGNOSTIC ---");
console.log(
  "AUTH_SECRET length:",
  process.env.AUTH_SECRET ? process.env.AUTH_SECRET.length : "MISSING",
);
console.log("AUTH_URL:", process.env.AUTH_URL || "MISSING");
console.log(
  "DATABASE_URL starts with:",
  process.env.DATABASE_URL
    ? process.env.DATABASE_URL.substring(0, 20)
    : "MISSING",
);
console.log("AUTH_TRUST_HOST:", process.env.AUTH_TRUST_HOST || "MISSING");
console.log("--- END ---");
