import { prisma } from "../prisma/db";
import bcrypt from "bcryptjs";

const cssQuestions = [
  {
    text: "Which CSS property controls the space outside an element's border?",
    options: [
      { text: "padding", is_correct: false },
      { text: "margin", is_correct: true },
      { text: "border-spacing", is_correct: false },
      { text: "spacing", is_correct: false },
    ],
  },
  {
    text: "In the CSS Box Model, what is the innermost part?",
    options: [
      { text: "Margin", is_correct: false },
      { text: "Padding", is_correct: false },
      { text: "Content", is_correct: true },
      { text: "Border", is_correct: false },
    ],
  },
  {
    text: "Which value of 'display' creates a block-level flex container?",
    options: [
      { text: "inline-flex", is_correct: false },
      { text: "flex", is_correct: true },
      { text: "block-flex", is_correct: false },
      { text: "grid", is_correct: false },
    ],
  },
  {
    text: "What property is used to change the background color?",
    options: [
      { text: "color", is_correct: false },
      { text: "bgcolor", is_correct: false },
      { text: "background-color", is_correct: true },
      { text: "background", is_correct: false }, // technically shorthand but strictly background-color is best
    ],
  },
  {
    text: "How do you select an element with id 'demo'?",
    options: [
      { text: ".demo", is_correct: false },
      { text: "#demo", is_correct: true },
      { text: "*demo", is_correct: false },
      { text: "demo", is_correct: false },
    ],
  },
  {
    text: "Which CSS property is used to create a CSS Grid?",
    options: [
      { text: "display: flex;", is_correct: false },
      { text: "display: grid;", is_correct: true },
      { text: "grid-template: auto;", is_correct: false },
      { text: "align-items: grid;", is_correct: false },
    ],
  },
  {
    text: "What does CSS stand for?",
    options: [
      { text: "Creative Style Sheets", is_correct: false },
      { text: "Computer Style Sheets", is_correct: false },
      { text: "Cascading Style Sheets", is_correct: true },
      { text: "Colorful Style Sheets", is_correct: false },
    ],
  },
  {
    text: "Which property is used to change the font of an element?",
    options: [
      { text: "font-family", is_correct: true },
      { text: "font-weight", is_correct: false },
      { text: "font-style", is_correct: false },
      { text: "text-font", is_correct: false },
    ],
  },
  {
    text: "What is the default value of the position property?",
    options: [
      { text: "relative", is_correct: false },
      { text: "absolute", is_correct: false },
      { text: "fixed", is_correct: false },
      { text: "static", is_correct: true },
    ],
  },
  {
    text: "How do you make the text bold in CSS?",
    options: [
      { text: "font: bold;", is_correct: false },
      { text: "text-weight: bold;", is_correct: false },
      { text: "font-weight: bold;", is_correct: true },
      { text: "style: bold;", is_correct: false },
    ],
  },
];

async function main() {
  console.log("Seeding Database...");

  // 1. Create a Student
  const student = await prisma.student.upsert({
    where: { student_num: "2024-001" },
    update: {},
    create: {
      student_num: "2024-001",
      firstname: "John",
      lastname: "Doe",
      email: "john@students.edu",
    },
  });

  // 2. Create a Subject
  const subject = await prisma.subject.upsert({
    where: { subject_code: "CSS-101" },
    update: {},
    create: {
      subject_code: "CSS-101",
      subject_name: "Advanced CSS Layouts",
    },
  });

  // 3. Create a Term
  const term = await prisma.academicTerm.create({
    data: {
      school_year: "2025-2026",
      semester: "First Semester",
    },
  });

  // 4. Enroll Student in Subject
  await prisma.enrollment.create({
    data: {
      student_id: student.id,
      subject_id: subject.id,
      term_id: term.id,
    },
  });

  // 5. Create a Teacher/Admin
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@quiz.com" },
    update: {},
    create: {
      email: "teacher@quiz.com",
      fullname: "Jane Smith",
      password_hash: bcrypt.hashSync("admin", 10),
      role: "exam_creator",
    },
  });

  // 6. Create the Exam
  const exam = await prisma.exam.create({
    data: {
      subject_id: subject.id,
      creator_id: teacher.id,
      exam_name: "Midterm CSS Mastery",
      total_marks: 50,
    },
  });

  // 7. Generate exactly 50 questions by repeating the base pool 5 times
  let orderIndex = 1;
  for (let i = 0; i < 5; i++) {
    for (const q of cssQuestions) {
      await prisma.question.create({
        data: {
          exam_id: exam.id,
          question_text: `[Q${orderIndex}] ${q.text}`,
          marks: 1,
          order_index: orderIndex,
          options: {
            create: q.options.map((opt) => ({
              option_text: opt.text,
              is_correct: opt.is_correct,
            })),
          },
        },
      });
      orderIndex++;
    }
  }

  console.log(
    `Successfully seeded! Use Student Number: ${student.student_num} to login.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
