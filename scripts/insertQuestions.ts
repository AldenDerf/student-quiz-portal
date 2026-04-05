import { prisma } from "../prisma/db";

const questionsData = [
  {
    id: 1,
    category: "CSS Introduction",
    question: "What does CSS stand for?",
    options: [
      "Creative Style Sheets",
      "Cascading Style Sheets",
      "Computer Style Sheets",
      "Colorful Style Sheets",
    ],
    answer: "Cascading Style Sheets",
  },
  {
    id: 2,
    category: "CSS Introduction",
    question: "Which HTML tag is used for internal CSS?",
    options: ["<script>", "<style>", "<css>", "<link>"],
    answer: "<style>",
  },
  {
    id: 3,
    category: "CSS Introduction",
    question: "How do you insert a comment in CSS?",
    options: ["// comment", "<!-- comment -->", "/* comment */", "' comment"],
    answer: "/* comment */",
  },
  {
    id: 4,
    category: "CSS Introduction",
    question: "Which property is used to change the text color?",
    options: ["text-color", "font-color", "color", "background-color"],
    answer: "color",
  },
  {
    id: 5,
    category: "CSS Introduction",
    question: "Which selector is used to target all elements on a page?",
    options: [".", "#", "*", "&"],
    answer: "*",
  },
  {
    id: 6,
    category: "CSS Introduction",
    question:
      "What is the correct syntax to select an element with the ID 'header'?",
    options: [".header", "#header", "header", "*header"],
    answer: "#header",
  },
  {
    id: 7,
    category: "CSS Introduction",
    question: "Where is the link to an external CSS file typically placed?",
    options: [
      "<body> section",
      "<footer> section",
      "<head> section",
      "At the end of the document",
    ],
    answer: "<head> section",
  },
  {
    id: 8,
    category: "CSS Introduction",
    question: "Which property changes the font of an element?",
    options: ["font-weight", "font-style", "font-family", "text-font"],
    answer: "font-family",
  },
  {
    id: 9,
    category: "CSS Introduction",
    question: "Which property is used to make text bold?",
    options: ["font-style", "text-decoration", "font-weight", "font-size"],
    answer: "font-weight",
  },
  {
    id: 10,
    category: "CSS Introduction",
    question: "How do you remove the underline from hyperlinks?",
    options: [
      "text-decoration: none;",
      "underline: none;",
      "text-style: none;",
      "decoration: none;",
    ],
    answer: "text-decoration: none;",
  },
  {
    id: 11,
    category: "Box Model",
    question:
      "What is located between the content and the border in the Box Model?",
    options: ["Margin", "Padding", "Outline", "Gap"],
    answer: "Padding",
  },
  {
    id: 12,
    category: "Box Model",
    question: "Which property is used to add space outside the border?",
    options: ["Padding", "Margin", "Spacing", "Border-width"],
    answer: "Margin",
  },
  {
    id: 13,
    category: "Box Model",
    question: "Which property includes padding and border in the total width?",
    options: [
      "box-sizing: content-box;",
      "box-sizing: border-box;",
      "width-mode: full;",
      "display: block;",
    ],
    answer: "box-sizing: border-box;",
  },
  {
    id: 14,
    category: "Box Model",
    question: "If you set margin: 10px 20px;, what is the margin at the top?",
    options: ["20px", "10px", "5px", "0px"],
    answer: "10px",
  },
  {
    id: 15,
    category: "Box Model",
    question: "Which property places a border around an element?",
    options: ["border-style", "border", "border-width", "outline"],
    answer: "border",
  },
  {
    id: 16,
    category: "Box Model",
    question: "What is the default value of the box-sizing property?",
    options: ["border-box", "padding-box", "content-box", "inherit"],
    answer: "content-box",
  },
  {
    id: 17,
    category: "Box Model",
    question: "Which property is used to round the corners of a border?",
    options: [
      "border-circle",
      "border-round",
      "border-radius",
      "corner-radius",
    ],
    answer: "border-radius",
  },
  {
    id: 18,
    category: "Box Model",
    question:
      "Which part of the Box Model is transparent and has no background color?",
    options: ["Padding", "Border", "Margin", "Content"],
    answer: "Margin",
  },
  {
    id: 19,
    category: "Box Model",
    question:
      "In the shorthand padding: 10px 5px 15px 20px;, what is the padding on the left?",
    options: ["10px", "5px", "15px", "20px"],
    answer: "20px",
  },
  {
    id: 20,
    category: "Box Model",
    question: "Which property sets the thickness of the border?",
    options: [
      "border-weight",
      "border-size",
      "border-width",
      "border-thickness",
    ],
    answer: "border-width",
  },
  {
    id: 21,
    category: "Flexbox",
    question:
      "Which display value is required to make an element a Flex container?",
    options: [
      "display: block;",
      "display: flex;",
      "display: flexbox;",
      "display: grid;",
    ],
    answer: "display: flex;",
  },
  {
    id: 22,
    category: "Flexbox",
    question: "What is the default direction of flex items?",
    options: ["column", "row", "row-reverse", "stack"],
    answer: "row",
  },
  {
    id: 23,
    category: "Flexbox",
    question: "Which property is used to align items along the main axis?",
    options: ["align-items", "justify-content", "align-content", "flex-align"],
    answer: "justify-content",
  },
  {
    id: 24,
    category: "Flexbox",
    question: "Which property is used to align items along the cross axis?",
    options: ["align-items", "justify-content", "align-content", "flex-center"],
    answer: "align-items",
  },
  {
    id: 25,
    category: "Flexbox",
    question:
      "How do you allow flex items to wrap to a new line when space is limited?",
    options: [
      "flex-wrap: wrap;",
      "flex-flow: row;",
      "display: grid;",
      "flex-break: true;",
    ],
    answer: "flex-wrap: wrap;",
  },
  {
    id: 26,
    category: "Flexbox",
    question:
      "What is the shorthand property for flex-direction and flex-wrap?",
    options: ["flex-style", "flex-flow", "flex-basis", "flex-group"],
    answer: "flex-flow",
  },
  {
    id: 27,
    category: "Flexbox",
    question:
      "Which property allows a flex item to grow and fill available space?",
    options: ["flex-shrink", "flex-grow", "flex-basis", "flex-fill"],
    answer: "flex-grow",
  },
  {
    id: 28,
    category: "Flexbox",
    question:
      "Which property is used to change the visual order of a specific flex item?",
    options: ["item-order", "z-index", "order", "flex-order"],
    answer: "order",
  },
  {
    id: 29,
    category: "Flexbox",
    question: "What is the default value of align-items?",
    options: ["center", "flex-start", "stretch", "baseline"],
    answer: "stretch",
  },
  {
    id: 30,
    category: "Flexbox",
    question:
      "Which property is used to align a specific item along the cross axis, overriding the container?",
    options: ["align-content", "align-self", "justify-self", "flex-align"],
    answer: "align-self",
  },
  {
    id: 31,
    category: "CSS Grid",
    question:
      "Which display value is required to make an element a Grid container?",
    options: [
      "display: table;",
      "display: grid;",
      "display: block-grid;",
      "display: layout-grid;",
    ],
    answer: "display: grid;",
  },
  {
    id: 32,
    category: "CSS Grid",
    question:
      "Which property defines the number and size of columns in a grid?",
    options: [
      "grid-columns",
      "grid-template-columns",
      "columns",
      "grid-layout-columns",
    ],
    answer: "grid-template-columns",
  },
  {
    id: 33,
    category: "CSS Grid",
    question: "What does the 'fr' unit represent in CSS Grid?",
    options: ["Fixed ratio", "Fractional unit", "Font relative", "Final row"],
    answer: "Fractional unit",
  },
  {
    id: 34,
    category: "CSS Grid",
    question: "Which property sets the space between grid items?",
    options: ["grid-spacing", "gap", "margin", "padding"],
    answer: "gap",
  },
  {
    id: 35,
    category: "CSS Grid",
    question: "How do you make a grid item span across two columns?",
    options: [
      "grid-column: span 2;",
      "grid-span: 2;",
      "column-merge: 2;",
      "grid-width: 2;",
    ],
    answer: "grid-column: span 2;",
  },
  {
    id: 36,
    category: "CSS Grid",
    question: "What is the shorthand property for row-gap and column-gap?",
    options: ["spacing", "gutter", "gap", "grid-gap"],
    answer: "gap",
  },
  {
    id: 37,
    category: "CSS Grid",
    question:
      "Which property is used to name specific grid areas in the layout?",
    options: [
      "grid-template-areas",
      "grid-names",
      "grid-layout-map",
      "area-names",
    ],
    answer: "grid-template-areas",
  },
  {
    id: 38,
    category: "CSS Grid",
    question:
      "How do you align all grid items to the center of their cell horizontally?",
    options: [
      "align-items: center;",
      "justify-items: center;",
      "place-items: center;",
      "grid-align: center;",
    ],
    answer: "justify-items: center;",
  },
  {
    id: 39,
    category: "CSS Grid",
    question:
      "Which property sets the size of rows that are not explicitly defined?",
    options: [
      "grid-auto-rows",
      "grid-template-rows",
      "grid-row-size",
      "auto-rows",
    ],
    answer: "grid-auto-rows",
  },
  {
    id: 40,
    category: "CSS Grid",
    question:
      "Which property is used to place an item into a specific named grid area?",
    options: ["grid-name", "grid-area", "area-assign", "grid-item-place"],
    answer: "grid-area",
  },
  {
    id: 41,
    category: "Responsive Design",
    question: "What is the primary goal of Responsive Web Design?",
    options: [
      "To make the website faster",
      "To make it look good on all screen sizes",
      "To add animations",
      "To ensure it works on Internet Explorer",
    ],
    answer: "To make it look good on all screen sizes",
  },
  {
    id: 42,
    category: "Responsive Design",
    question:
      "Which meta tag is necessary to control the viewport on mobile devices?",
    options: [
      '<meta name="mobile">',
      '<meta name="viewport">',
      '<meta name="screen">',
      '<meta name="layout">',
    ],
    answer: '<meta name="viewport">',
  },
  {
    id: 43,
    category: "Responsive Design",
    question: "Which CSS rule is used to define Media Queries?",
    options: ["@query", "@media", "@screen", "@responsive"],
    answer: "@media",
  },
  {
    id: 44,
    category: "Responsive Design",
    question: "In a Media Query, what does min-width: 768px mean?",
    options: [
      "Styles for screens 768px and smaller",
      "Styles for screens 768px and larger",
      "Styles for a height of 768px",
      "Styles for images only",
    ],
    answer: "Styles for screens 768px and larger",
  },
  {
    id: 45,
    category: "Responsive Design",
    question: "What is the 'Mobile First' strategy?",
    options: [
      "Designing the mobile layout before the desktop layout",
      "Making a separate app for mobile",
      "Disabling the desktop version",
      "Using small images only",
    ],
    answer: "Designing the mobile layout before the desktop layout",
  },
  {
    id: 46,
    category: "Responsive Design",
    question: "Which unit is the most fluid for responsive layouts?",
    options: ["px", "%", "pt", "cm"],
    answer: "%",
  },
  {
    id: 47,
    category: "Responsive Design",
    question:
      "What is the term for the specific screen width where a website's layout changes?",
    options: ["Cutting point", "Change point", "Breakpoint", "Switch point"],
    answer: "Breakpoint",
  },
  {
    id: 48,
    category: "Responsive Design",
    question:
      "Which property prevents an image from exceeding the width of its container?",
    options: [
      "width: 100%;",
      "max-width: 100%;",
      "min-width: 100%;",
      "image-size: contain;",
    ],
    answer: "max-width: 100%;",
  },
  {
    id: 49,
    category: "Responsive Design",
    question: "What does '100vw' represent?",
    options: [
      "100% of the viewport width",
      "100 virtual width",
      "100 pixels wide",
      "100% of the parent width",
    ],
    answer: "100% of the viewport width",
  },
  {
    id: 50,
    category: "Responsive Design",
    question:
      "How do you hide an element on mobile devices using a media query?",
    options: [
      "visibility: hidden;",
      "display: none;",
      "opacity: 0;",
      "remove: true;",
    ],
    answer: "display: none;",
  },
];

async function main() {
  const EXAM_ID = 4; // Target Exam ID as requested

  console.log(`Starting insertion of 50 questions for Exam ID: ${EXAM_ID}...`);

  for (let i = 0; i < questionsData.length; i++) {
    const q = questionsData[i];

    // Create Question
    const question = await prisma.question.create({
      data: {
        exam_id: EXAM_ID,
        question_text: q.question,
        marks: 1,
        order_index: i + 1,
        options: {
          create: q.options.map((opt) => ({
            option_text: opt,
            is_correct: opt === q.answer,
          })),
        },
      },
    });

    if (i % 10 === 0 || i === 49) {
      console.log(
        `Inserted question ${i + 1}/50: ${q.question.substring(0, 30)}...`,
      );
    }
  }

  console.log(
    "Success! 50 questions and their options have been linked to Exam ID 4.",
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
