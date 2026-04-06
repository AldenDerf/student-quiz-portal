import { prisma } from "../prisma/db";
import { submitExam } from "../app/actions/exam";
import * as fs from "fs";

async function main() {
  const log: string[] = [];
  const logMsg = (msg: string) => {
    console.log(msg);
    log.push(msg);
  };

  logMsg("Verifying Proportional Retake Logic and Limits...");

  // 1. Get or create a student
  let student = await prisma.student.findFirst();
  if (!student) {
    student = await prisma.student.create({
      data: {
        student_num: "TEST-003",
        firstname: "Prop",
        lastname: "Test",
        email: "prop@example.com",
      },
    });
  }
  logMsg("Using Student ID: " + student.id);

  // 2. Get or create an exam
  let exam = await prisma.exam.findFirst({
    include: { questions: { include: { options: true } } },
  });
  if (!exam) {
    logMsg("No exam found in database.");
    return;
  }
  logMsg("Using Exam ID: " + exam.id + " Name: " + exam.exam_name);

  // 3. Clean up previous results for this test
  await prisma.examResult.deleteMany({
    where: { student_id: student.id, exam_id: exam.id },
  });
  logMsg("Cleaned up previous results for test student.");

  // 4. Attempt 1: First Take (Perfect)
  const selections: Record<number, number> = {};
  for (const q of exam.questions) {
    const correctOption = q.options.find((o) => o.is_correct);
    if (correctOption) selections[q.id] = correctOption.id;
  }

  logMsg("--- Attempt 1: First Take (Perfect) ---");
  const result1 = await submitExam(student.id, exam.id, selections);
  const record1 = await prisma.examResult.findUnique({
    where: { id: result1.resultId },
  });
  logMsg("Result 1: " + Number(record1?.percentage) + "% (Expected: 100%)");

  // 5. Attempt 2: Retake (Nearly Perfect e.g. 48/50 = 96%)
  logMsg("--- Attempt 2: Retake (Nearly Perfect) ---");
  // Simulating nearly perfect score (missing one question)
  const nearlyPerfect: Record<number, number> = { ...selections };
  if (exam.questions.length > 0) {
    const q = exam.questions[0];
    const wrongOption = q.options.find((o) => !o.is_correct);
    if (wrongOption) nearlyPerfect[q.id] = wrongOption.id;
  }

  const result2 = await submitExam(student.id, exam.id, nearlyPerfect);
  const record2 = await prisma.examResult.findUnique({
    where: { id: result2.resultId },
  });

  const score = exam.questions.slice(1).reduce((acc, q) => acc + q.marks, 0);
  const calcPerc = (score / exam.total_marks) * 100;
  const expectedPerc = parseFloat((calcPerc * 0.95).toFixed(2));

  logMsg(
    "Result 2: " +
      Number(record2?.percentage) +
      "% (Expected Proportional: " +
      expectedPerc +
      "%)",
  );

  // 6. Attempt 2: Retake (Perfect again)
  // Need to clear Attempt 2 first to test another retake scenario
  await prisma.examResult.delete({ where: { id: result2.resultId } });

  logMsg("--- Attempt 2: Retake (Perfect) ---");
  const resultPerfectRetake = await submitExam(student.id, exam.id, selections);
  const recordPerfectRetake = await prisma.examResult.findUnique({
    where: { id: resultPerfectRetake.resultId },
  });
  logMsg(
    "Result Perfect Retake: " +
      Number(recordPerfectRetake?.percentage) +
      "% (Expected: 95%)",
  );

  logMsg("Verification Finished.");
  fs.writeFileSync("test_results.txt", log.join("\n"));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
