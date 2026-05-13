export const STARTER_CODE = `function setup() {
  createCanvas(640, 360);
  textFont('system-ui');
}

function draw() {
  background(245, 248, 255);
  noStroke();
  fill(22, 31, 63);
  textSize(28);
  textStyle(BOLD);
  text('School Quiz Game', 44, 92);
  textStyle(NORMAL);
  textSize(15);
  fill(91, 103, 138);
  text('Pick the first small step, make one change, then run the preview.', 44, 126);
  fill(37, 99, 255);
  rect(44, 168, 220, 48, 8);
  fill(255);
  textSize(17);
  text('Ready for Step 1', 68, 198);
}`;

export const QUIZ_MILESTONE_1_CODE = `function setup() {
  createCanvas(640, 360);
  textFont('system-ui');
}

function draw() {
  background(222, 241, 255);
  drawSchoolScene();
  drawStartCard();
}

function drawSchoolScene() {
  noStroke();
  fill(255);
  ellipse(120, 70, 74, 28);
  ellipse(510, 82, 90, 34);
  fill(127, 199, 120);
  rect(0, 270, width, 90);
  fill(235, 146, 66);
  rect(240, 214, 160, 58, 6);
  fill(170, 72, 64);
  triangle(220, 214, 320, 164, 420, 214);
  fill(105, 82, 190);
  rect(300, 230, 38, 42, 5);
  fill(255, 240, 180);
  rect(258, 228, 24, 20, 4);
  rect(358, 228, 24, 20, 4);
}

function drawStartCard() {
  fill(255);
  rect(150, 52, 340, 172, 14);
  fill(22, 31, 63);
  textAlign(CENTER, CENTER);
  textSize(30);
  textStyle(BOLD);
  text('School Quiz', width / 2, 104);
  textStyle(NORMAL);
  textSize(15);
  fill(91, 103, 138);
  text('Test your knowledge about our school!', width / 2, 138);
  fill(37, 99, 255);
  rect(250, 162, 140, 44, 8);
  fill(255);
  textSize(17);
  text('Start', width / 2, 184);
  textAlign(LEFT, BASELINE);
}`;

export const QUIZ_MILESTONE_2_CODE = `let screen = 'start';

function setup() {
  createCanvas(640, 360);
  textFont('system-ui');
}

function draw() {
  background(245, 248, 255);
  if (screen === 'start') {
    drawStartScreen();
  } else {
    drawQuestionScreen();
  }
}

function mouseClicked() {
  if (screen === 'start' && mouseX > 250 && mouseX < 390 && mouseY > 162 && mouseY < 206) {
    screen = 'question';
  }
}

function drawStartScreen() {
  fill(22, 31, 63);
  textSize(30);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text('School Quiz', width / 2, 104);
  textStyle(NORMAL);
  textSize(15);
  fill(91, 103, 138);
  text('Click Start to load the first question.', width / 2, 136);
  fill(37, 99, 255);
  rect(250, 162, 140, 44, 8);
  fill(255);
  textSize(17);
  text('Start', width / 2, 184);
  textAlign(LEFT, BASELINE);
}

function drawQuestionScreen() {
  fill(255);
  rect(52, 44, 536, 270, 14);
  fill(22, 31, 63);
  textSize(14);
  text('Q1 of 5', 84, 82);
  textSize(22);
  textStyle(BOLD);
  text('What year was our school founded?', 84, 124);
  textStyle(NORMAL);
  drawChoice(84, 168, 'A', '1995');
  drawChoice(332, 168, 'B', '2001');
  drawChoice(84, 232, 'C', '2008');
  drawChoice(332, 232, 'D', '2015');
}

function drawChoice(x, y, letter, label) {
  fill(250, 252, 255);
  stroke(213, 222, 245);
  rect(x, y, 208, 44, 8);
  noStroke();
  fill(37, 99, 255);
  circle(x + 28, y + 22, 24);
  fill(255);
  textSize(13);
  text(letter, x + 24, y + 27);
  fill(22, 31, 63);
  textSize(15);
  text(label, x + 62, y + 28);
}`;

export const QUIZ_MILESTONE_3_CODE = `let screen = 'question';
let selectedAnswer = null;
let correctAnswer = 'B';

function setup() {
  createCanvas(640, 360);
  textFont('system-ui');
}

function draw() {
  background(245, 248, 255);
  drawQuestionScreen();
  if (selectedAnswer) drawFeedback();
}

function mouseClicked() {
  const choices = [
    { key: 'A', x: 84, y: 168 },
    { key: 'B', x: 332, y: 168 },
    { key: 'C', x: 84, y: 232 },
    { key: 'D', x: 332, y: 232 }
  ];
  for (const choice of choices) {
    if (mouseX > choice.x && mouseX < choice.x + 208 && mouseY > choice.y && mouseY < choice.y + 44) {
      selectedAnswer = choice.key;
    }
  }
}

function drawQuestionScreen() {
  fill(255);
  rect(52, 36, 536, 290, 14);
  fill(22, 31, 63);
  textSize(14);
  text('Q1 of 5', 84, 74);
  textSize(22);
  textStyle(BOLD);
  text('What year was our school founded?', 84, 116);
  textStyle(NORMAL);
  drawChoice(84, 158, 'A', '1995');
  drawChoice(332, 158, 'B', '2001');
  drawChoice(84, 222, 'C', '2008');
  drawChoice(332, 222, 'D', '2015');
}

function drawChoice(x, y, letter, label) {
  const chosen = selectedAnswer === letter;
  fill(chosen ? '#eef4ff' : '#fafcff');
  stroke(chosen ? '#2563ff' : '#d5def5');
  strokeWeight(chosen ? 2 : 1);
  rect(x, y, 208, 44, 8);
  noStroke();
  fill(37, 99, 255);
  circle(x + 28, y + 22, 24);
  fill(255);
  textSize(13);
  text(letter, x + 24, y + 27);
  fill(22, 31, 63);
  textSize(15);
  text(label, x + 62, y + 28);
}

function drawFeedback() {
  const correct = selectedAnswer === correctAnswer;
  fill(correct ? '#dcfce7' : '#fee2e2');
  rect(84, 286, 452, 30, 8);
  fill(correct ? '#047857' : '#b91c1c');
  textSize(14);
  text(correct ? 'Correct! The score can go up.' : 'Try again. Show feedback after each answer.', 104, 306);
}`;

export const QUIZ_MILESTONE_4_CODE = `let selectedAnswer = null;
let correctAnswer = 'B';
let score = 0;
let answered = false;

function setup() {
  createCanvas(640, 360);
  textFont('system-ui');
}

function draw() {
  background(245, 248, 255);
  drawQuestionScreen();
  drawScore();
  if (selectedAnswer) drawFeedback();
}

function mouseClicked() {
  if (answered) return;
  const choices = [
    { key: 'A', x: 84, y: 168 },
    { key: 'B', x: 332, y: 168 },
    { key: 'C', x: 84, y: 232 },
    { key: 'D', x: 332, y: 232 }
  ];
  for (const choice of choices) {
    if (mouseX > choice.x && mouseX < choice.x + 208 && mouseY > choice.y && mouseY < choice.y + 44) {
      selectedAnswer = choice.key;
      answered = true;
      if (choice.key === correctAnswer) score += 1;
    }
  }
}

function drawQuestionScreen() {
  fill(255);
  rect(52, 36, 536, 290, 14);
  fill(22, 31, 63);
  textSize(14);
  text('Q1 of 5', 84, 74);
  textSize(22);
  textStyle(BOLD);
  text('What year was our school founded?', 84, 116);
  textStyle(NORMAL);
  drawChoice(84, 158, 'A', '1995');
  drawChoice(332, 158, 'B', '2001');
  drawChoice(84, 222, 'C', '2008');
  drawChoice(332, 222, 'D', '2015');
}

function drawChoice(x, y, letter, label) {
  const chosen = selectedAnswer === letter;
  fill(chosen ? '#eef4ff' : '#fafcff');
  stroke(chosen ? '#2563ff' : '#d5def5');
  strokeWeight(chosen ? 2 : 1);
  rect(x, y, 208, 44, 8);
  noStroke();
  fill(37, 99, 255);
  circle(x + 28, y + 22, 24);
  fill(255);
  textSize(13);
  text(letter, x + 24, y + 27);
  fill(22, 31, 63);
  textSize(15);
  text(label, x + 62, y + 28);
}

function drawFeedback() {
  fill(selectedAnswer === correctAnswer ? '#dcfce7' : '#fee2e2');
  rect(84, 286, 452, 30, 8);
  fill(selectedAnswer === correctAnswer ? '#047857' : '#b91c1c');
  textSize(14);
  text(selectedAnswer === correctAnswer ? 'Correct! Score updated.' : 'Not quite. Score stays the same.', 104, 306);
}

function drawScore() {
  fill(37, 99, 255);
  textSize(15);
  text('Score: ' + score, 500, 74);
}`;

export const QUIZ_MILESTONE_5_CODE = `let questions = [
  { prompt: 'What year was our school founded?', choices: ['1995', '2001', '2008', '2015'], answer: 1 },
  { prompt: 'Where is the library?', choices: ['North wing', 'Gym', 'Cafeteria', 'Playground'], answer: 0 },
  { prompt: 'Which club meets on Friday?', choices: ['Robotics', 'Cooking', 'Drama', 'Chess'], answer: 2 }
];
let currentQuestion = 0;
let selectedIndex = null;
let score = 0;
let finished = false;

function setup() {
  createCanvas(640, 360);
  textFont('system-ui');
}

function draw() {
  background(245, 248, 255);
  if (finished) {
    drawResults();
  } else {
    drawQuestion();
  }
}

function mouseClicked() {
  if (finished) return;
  const positions = [
    { x: 84, y: 158 },
    { x: 332, y: 158 },
    { x: 84, y: 222 },
    { x: 332, y: 222 }
  ];
  for (let i = 0; i < positions.length; i += 1) {
    const box = positions[i];
    if (mouseX > box.x && mouseX < box.x + 208 && mouseY > box.y && mouseY < box.y + 44) {
      selectedIndex = i;
      if (i === questions[currentQuestion].answer) score += 1;
    }
  }
  if (mouseX > 250 && mouseX < 390 && mouseY > 292 && mouseY < 332 && selectedIndex !== null) {
    currentQuestion += 1;
    selectedIndex = null;
    if (currentQuestion >= questions.length) finished = true;
  }
}

function drawQuestion() {
  const question = questions[currentQuestion];
  fill(255);
  rect(52, 36, 536, 308, 14);
  fill(22, 31, 63);
  textSize(14);
  text('Q' + (currentQuestion + 1) + ' of ' + questions.length, 84, 74);
  fill(37, 99, 255);
  text('Score: ' + score, 500, 74);
  fill(22, 31, 63);
  textSize(21);
  textStyle(BOLD);
  text(question.prompt, 84, 116);
  textStyle(NORMAL);
  for (let i = 0; i < question.choices.length; i += 1) {
    drawChoice(i, question.choices[i]);
  }
  fill(selectedIndex === null ? '#dbe4f8' : '#2563ff');
  rect(250, 292, 140, 40, 8);
  fill(255);
  textSize(15);
  text('Next', 304, 317);
}

function drawChoice(index, label) {
  const positions = [
    { x: 84, y: 158 },
    { x: 332, y: 158 },
    { x: 84, y: 222 },
    { x: 332, y: 222 }
  ];
  const box = positions[index];
  const chosen = selectedIndex === index;
  fill(chosen ? '#eef4ff' : '#fafcff');
  stroke(chosen ? '#2563ff' : '#d5def5');
  strokeWeight(chosen ? 2 : 1);
  rect(box.x, box.y, 208, 44, 8);
  noStroke();
  fill(37, 99, 255);
  circle(box.x + 28, box.y + 22, 24);
  fill(255);
  textSize(13);
  text(String.fromCharCode(65 + index), box.x + 24, box.y + 27);
  fill(22, 31, 63);
  textSize(15);
  text(label, box.x + 62, box.y + 28);
}

function drawResults() {
  fill(255);
  rect(130, 74, 380, 210, 14);
  fill(22, 31, 63);
  textAlign(CENTER, CENTER);
  textSize(28);
  textStyle(BOLD);
  text('Quiz complete!', width / 2, 132);
  textStyle(NORMAL);
  textSize(18);
  fill(37, 99, 255);
  text('Score: ' + score + ' / ' + questions.length, width / 2, 178);
  fill(91, 103, 138);
  textSize(14);
  text('You can add more questions next.', width / 2, 218);
  textAlign(LEFT, BASELINE);
}`;

type MilestoneCodeTarget =
  | string
  | number
  | {
      order?: number;
      title?: string;
      visibleOutput?: string;
      doneChecklist?: string[];
    };

function textForTarget(target: MilestoneCodeTarget): string {
  if (typeof target === "string") return target;
  if (typeof target === "number") return String(target);
  return [target.title, target.visibleOutput, ...(target.doneChecklist ?? [])].filter(Boolean).join(" ");
}

function orderForTarget(target: MilestoneCodeTarget): number | undefined {
  if (typeof target === "number") return target;
  if (typeof target === "object") return target.order;
  return undefined;
}

export function codeForMilestone(target: MilestoneCodeTarget): string {
  const text = textForTarget(target).toLowerCase();

  if (/\bthree\b|\b3\s+(questions|question quiz|total)\b|multiple questions|all questions|question count|complete|result|final/.test(text)) return QUIZ_MILESTONE_5_CODE;
  if (/score|points/.test(text)) return QUIZ_MILESTONE_4_CODE;
  if (/correct|incorrect|feedback|try again|answer choices are shown/.test(text)) return QUIZ_MILESTONE_3_CODE;
  if (/first question|question screen|answer choice|multiple choice|four choices|3 answer choices/.test(text)) return QUIZ_MILESTONE_2_CODE;
  if (/start|title|beginning/.test(text)) return QUIZ_MILESTONE_1_CODE;

  const order = orderForTarget(target);
  if (order === 1) return QUIZ_MILESTONE_1_CODE;
  if (order === 2) return QUIZ_MILESTONE_2_CODE;
  if (order === 3) return QUIZ_MILESTONE_3_CODE;
  if (order === 4) return QUIZ_MILESTONE_4_CODE;
  if (order === 5) return QUIZ_MILESTONE_5_CODE;
  return STARTER_CODE;
}
