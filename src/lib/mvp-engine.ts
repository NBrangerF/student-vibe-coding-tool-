import {
  ChecklistFeedbackResponse,
  ClarificationResponse,
  DebugDiagnosisResponse,
  GoalInterviewResponse,
  GoalInterviewTurn,
  Milestone,
  MilestonePlanResponse,
  PatchResponse,
  PredictionQuestion,
  Project,
  ProjectPathMap,
  ProjectPathMapNode,
  ProjectPathResponse
} from "@/lib/types";
import { codeForMilestone, STARTER_CODE } from "@/lib/p5-code";

const ISO_STUB = "2026-05-12T00:00:00.000Z";
const REQUIRED_INTERVIEW_ANSWERS = 5;

function slugId(input: string): string {
  const ascii = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return ascii || "student-project";
}

function isQuizIdea(idea: string): boolean {
  return /quiz|school|question|trivia|问答|测验|学校|题/i.test(idea);
}

function projectTitleForIdea(idea: string): string {
  if (isQuizIdea(idea)) return "School Quiz Game";
  if (/pet|animal|adventure/i.test(idea)) return "Pet Adventure Game";
  if (/club|task|todo|team/i.test(idea)) return "Club Task App";
  if (/story|world|character/i.test(idea)) return "Story World Site";
  return "School Quiz Game";
}

const GOAL_INTERVIEW_QUESTIONS = [
  {
    id: "artifact-shape",
    prompt: "What should a player see first?",
    options: ["A title screen", "The first question", "A topic menu"],
    allowFreeText: true
  },
  {
    id: "player-action",
    prompt: "How should players answer?",
    options: ["Four choice buttons", "Type a short answer", "Click objects"],
    allowFreeText: true
  },
  {
    id: "success-feedback",
    prompt: "What feedback should appear after an answer?",
    options: ["Correct or try again", "Score changes", "Move to next question"],
    allowFreeText: true
  },
  {
    id: "first-milestone",
    prompt: "What is the smallest first build step?",
    options: ["Start screen only", "One playable question", "Question data first"],
    allowFreeText: true
  },
  {
    id: "style-boundary",
    prompt: "What should stay small for version one?",
    options: ["Five sample questions", "Simple school theme", "No accounts or sharing"],
    allowFreeText: true
  },
  {
    id: "later-ideas",
    prompt: "What should move to the later path?",
    options: ["More topics", "High scores", "Public gallery"],
    allowFreeText: true
  }
];

function answerFor(turns: GoalInterviewTurn[], questionId: string): string | undefined {
  return turns.find((turn) => turn.questionId === questionId)?.answer;
}

function nextQuestion(turns: GoalInterviewTurn[]) {
  return GOAL_INTERVIEW_QUESTIONS.find((question) => !turns.some((turn) => turn.questionId === question.id));
}

function draftNode(
  id: string,
  type: ProjectPathMapNode["type"],
  label: string,
  detail: string,
  evidence: string,
  status: ProjectPathMapNode["status"] = "draft"
): ProjectPathMapNode {
  return { id, type, status, label, detail, evidence };
}

export function createProjectPathMap(idea: string, turns: GoalInterviewTurn[] = []): ProjectPathMap {
  const title = projectTitleForIdea(idea);
  const artifactShape = answerFor(turns, "artifact-shape");
  const playerAction = answerFor(turns, "player-action");
  const successFeedback = answerFor(turns, "success-feedback");
  const firstMilestone = answerFor(turns, "first-milestone");
  const styleBoundary = answerFor(turns, "style-boundary");
  const laterIdeas = answerFor(turns, "later-ideas");

  const nodes: ProjectPathMapNode[] = [
    draftNode("goal", "goal", title, idea, "student idea", "known"),
    draftNode(
      "experience",
      "experience",
      artifactShape ? "Opening experience" : "Unknown first view",
      artifactShape ?? "Decide what the player sees before any code is generated.",
      artifactShape ? "student answer" : "open question",
      artifactShape ? "known" : "open"
    )
  ];

  if (artifactShape) {
    nodes.push(
      draftNode(
        "interaction",
        "mechanic",
        playerAction ? "Answer interaction" : "Unknown answer action",
        playerAction ?? "Choose how the player gives an answer.",
        playerAction ? "student answer" : "open question",
        playerAction ? "known" : "open"
      )
    );
  }

  if (playerAction) {
    nodes.push(
      draftNode(
        "feedback",
        "mechanic",
        successFeedback ? "Visible feedback" : "Unknown feedback",
        successFeedback ?? "Choose what tells the player that an answer did something.",
        successFeedback ? "student answer" : "open question",
        successFeedback ? "known" : "open"
      )
    );
  }

  if (successFeedback) {
    nodes.push(
      draftNode(
        "first-step",
        "mechanic",
        firstMilestone ? "First buildable step" : "Unknown first build",
        firstMilestone ?? "Narrow the first build step until it can be checked in preview.",
        firstMilestone ? "student answer" : "open question",
        firstMilestone ? "known" : "open"
      )
    );
  }

  if (firstMilestone) {
    nodes.push(
      draftNode(
        "boundary",
        "later",
        styleBoundary ? "Version-one boundary" : "Scope boundary",
        styleBoundary ?? "Keep the first version small enough to finish.",
        styleBoundary ? "student answer" : "open question",
        styleBoundary ? "known" : "open"
      )
    );
  }

  if (styleBoundary) {
    nodes.push(
      draftNode(
        "m1",
        "milestone",
        "Step 1 we can build",
        "Create the start screen so the quiz has a visible beginning.",
        "ready from interview",
        "known"
      )
    );
  }

  if (styleBoundary || laterIdeas) {
    nodes.push(
      draftNode(
        "later",
        "later",
        "Later path",
        laterIdeas ?? "Extra ideas stay parked until the first version works.",
        laterIdeas ? "student answer" : "system draft",
        laterIdeas ? "known" : "draft"
      )
    );
  }

  const answeredCount = turns.length;
  const confidence = Math.min(0.28 + answeredCount * 0.13, 0.93);
  const openQuestions = GOAL_INTERVIEW_QUESTIONS.filter((question) => !turns.some((turn) => turn.questionId === question.id)).map(
    (question) => question.prompt
  );

  return {
    title,
    summary:
      answeredCount === 0
        ? "The path map will grow one decision at a time."
        : `The map now reflects ${answeredCount} student decision${answeredCount === 1 ? "" : "s"}.`,
    confidence,
    nodes,
    edges: [
      { from: "goal", to: "experience", label: "starts with" },
      { from: "experience", to: "interaction", label: "needs" },
      { from: "interaction", to: "feedback", label: "creates" },
      { from: "feedback", to: "first-step", label: "narrows" },
      { from: "first-step", to: "boundary", label: "scopes" },
      { from: "boundary", to: "m1", label: "starts" },
      { from: "m1", to: "later", label: "then" }
    ],
    openQuestions,
    updatedAt: ISO_STUB
  };
}

export function createGoalInterview(idea: string): GoalInterviewResponse {
  const turns: GoalInterviewTurn[] = [];
  const pathMap = createProjectPathMap(idea, turns);

  return {
    engineSource: "fallback",
    reflectedGoal: "You want to make a small quiz game. I will ask a few questions before we build.",
    progressLabel: "0 / 5 answers",
    nextQuestion: GOAL_INTERVIEW_QUESTIONS[0],
    turns,
    pathMap,
    readiness: {
      answeredCount: 0,
      requiredCount: REQUIRED_INTERVIEW_ANSWERS,
      canGeneratePath: false,
      missing: GOAL_INTERVIEW_QUESTIONS.slice(0, REQUIRED_INTERVIEW_ANSWERS).map((question) => question.prompt)
    },
    assistantMessage: "Start with one decision. The map updates before any code is generated."
  };
}

export function answerGoalInterview(input: {
  idea: string;
  turns: GoalInterviewTurn[];
  questionId: string;
  answer: string;
}): GoalInterviewResponse {
  const question = GOAL_INTERVIEW_QUESTIONS.find((item) => item.id === input.questionId) ?? nextQuestion(input.turns);
  if (!question) {
    const pathMap = createProjectPathMap(input.idea, input.turns);
    return {
      engineSource: "fallback",
      reflectedGoal: "The core path is clear enough to generate a formal project path.",
      progressLabel: `${input.turns.length} / ${REQUIRED_INTERVIEW_ANSWERS} answers`,
      turns: input.turns,
      pathMap,
      readiness: {
        answeredCount: input.turns.length,
        requiredCount: REQUIRED_INTERVIEW_ANSWERS,
        canGeneratePath: input.turns.length >= REQUIRED_INTERVIEW_ANSWERS,
        missing: []
      },
      assistantMessage: "The map is ready for the first small step."
    };
  }

  const dedupedTurns = input.turns.filter((turn) => turn.questionId !== question.id);
  const turns: GoalInterviewTurn[] = [
    ...dedupedTurns,
    {
      questionId: question.id,
      prompt: question.prompt,
      answer: input.answer,
      createdAt: ISO_STUB
    }
  ];
  const pathMap = createProjectPathMap(input.idea, turns);
  const next = nextQuestion(turns);
  const missing = GOAL_INTERVIEW_QUESTIONS.slice(0, REQUIRED_INTERVIEW_ANSWERS)
    .filter((item) => !turns.some((turn) => turn.questionId === item.id))
    .map((item) => item.prompt);
  const canGeneratePath = turns.length >= REQUIRED_INTERVIEW_ANSWERS;

  return {
    engineSource: "fallback",
    reflectedGoal: `I added this decision to the path map: ${input.answer}`,
    progressLabel: `${Math.min(turns.length, REQUIRED_INTERVIEW_ANSWERS)} / ${REQUIRED_INTERVIEW_ANSWERS} answers`,
    nextQuestion: next,
    turns,
    pathMap,
    readiness: {
      answeredCount: Math.min(turns.length, REQUIRED_INTERVIEW_ANSWERS),
      requiredCount: REQUIRED_INTERVIEW_ANSWERS,
      canGeneratePath,
      missing
    },
    assistantMessage: canGeneratePath
      ? "The core route is clear. Generate the project path, or answer the optional later-path question."
      : "The map updated. One more decision will make the next step clearer."
  };
}

export function createClarification(idea: string): ClarificationResponse {
  const title = projectTitleForIdea(idea);
  const interview = createGoalInterview(idea);

  return {
    reflectedIdea: "I understand this as a quiz game where players answer school-themed questions and get immediate feedback.",
    suggestedTitle: title,
    questions: [
      {
        id: "artifact-shape",
        prompt: "What should the first version show?",
        options: ["A start screen", "One question", "A topic menu"],
        allowFreeText: true
      },
      {
        id: "first-visible-result",
        prompt: "What should be visible after the first build?",
        options: ["The title and Start button", "A question with choices", "A score display"],
        allowFreeText: true
      },
      {
        id: "style-choice",
        prompt: "What should the style feel like?",
        options: ["Clean school theme", "Playful game UI", "Simple prototype"],
        allowFreeText: true
      }
    ],
    interview
  };
}

export function createProjectPath(
  idea: string,
  planningInput: string[] | GoalInterviewTurn[] = [],
  providedPathMap?: ProjectPathMap
): ProjectPathResponse {
  const title = projectTitleForIdea(idea);
  const projectId = `project-${slugId(title)}`;
  const interviewTurns = planningInput.filter(
    (item): item is GoalInterviewTurn => typeof item === "object" && item !== null && "questionId" in item
  );
  const pathMap = providedPathMap ?? createProjectPathMap(idea, interviewTurns);
  const project: Project = {
    id: projectId,
    ownerId: "research-pilot-student",
    title,
    originalIdea: idea,
    projectType: "p5_game_animation",
    currentMilestoneId: `${projectId}-m1`,
    status: "path_generated",
    createdAt: ISO_STUB,
    updatedAt: ISO_STUB
  };

  const milestones: Milestone[] = [
    {
      id: `${projectId}-m1`,
      projectId,
      order: 1,
      title: "Create the start screen",
      visibleOutput: "The quiz opens with a title, short prompt, and Start button.",
      concepts: ["canvas", "screen layout", "button affordance"],
      doneChecklist: ["The quiz title is visible", "The Start button is visible", "The screen explains what the quiz is about"],
      status: "not_started"
    },
    {
      id: `${projectId}-m2`,
      projectId,
      order: 2,
      title: "Show the first question",
      visibleOutput: "Clicking Start shows one school question with four answer choices.",
      concepts: ["state", "mouse event", "data display"],
      doneChecklist: ["Clicking Start changes the screen", "The first question appears", "Four answer choices display correctly"],
      status: "not_started"
    },
    {
      id: `${projectId}-m3`,
      projectId,
      order: 3,
      title: "Check answers and show feedback",
      visibleOutput: "Choosing an answer shows whether it is correct or needs another try.",
      concepts: ["condition", "selection state", "feedback"],
      doneChecklist: ["Clicking an answer selects it", "Correct answers show positive feedback", "Incorrect answers show try-again feedback"],
      status: "not_started"
    },
    {
      id: `${projectId}-m4`,
      projectId,
      order: 4,
      title: "Keep score",
      visibleOutput: "The score updates when the player answers correctly.",
      concepts: ["variable", "score", "state update"],
      doneChecklist: ["The score is visible", "Correct answers increase the score", "Wrong answers do not increase the score"],
      status: "not_started"
    },
    {
      id: `${projectId}-m5`,
      projectId,
      order: 5,
      title: "Add more questions and results",
      visibleOutput: "The quiz moves through multiple questions and ends with a result screen.",
      concepts: ["array", "index", "results state"],
      doneChecklist: ["The quiz has at least three questions", "Next moves to the following question", "A final score appears at the end"],
      status: "not_started"
    }
  ];

  return {
    engineSource: "fallback",
    project,
    milestones,
    starterCode: STARTER_CODE,
    pathMap,
    assistantMessage:
      planningInput.length > 0
        ? "I turned your answers into small steps. Each step has something you can see."
        : "Here is a small path for a playable quiz. You can rename, split, or reorder steps later."
  };
}

function readableChecklistItem(item: string): string {
  return item.replace(/\.$/u, "").replace(/\s+/gu, " ").trim();
}

function parseChecklistDraft(draft: string): string[] {
  return draft
    .split(/\n|;/u)
    .map((line) =>
      line
        .replace(/^\s*(?:[-*]|\d+[.)]|□|\[ ?\])\s*/u, "")
        .replace(/\s+/gu, " ")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 6);
}

function isVagueChecklistItem(item: string): boolean {
  const text = item.toLowerCase();
  if (text.length < 8) return true;
  if (/^(it works|works|looks good|it looks good|the game is fun|fun|done|finished)$/iu.test(text)) return true;
  return !/(i can|when|click|tap|type|see|show|appear|change|tell|message|score|button|answer|screen|question|right|wrong|correct|try again)/iu.test(text);
}

function overlapScore(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/[^a-z0-9]+/u).filter((word) => word.length > 3));
  const bWords = b.toLowerCase().split(/[^a-z0-9]+/u).filter((word) => word.length > 3);
  return bWords.filter((word) => aWords.has(word)).length;
}

function checkableVersion(item: string): string {
  const cleaned = readableChecklistItem(item);
  if (/^(i can|when|the|a|an)\b/iu.test(cleaned)) return cleaned;
  if (/click|tap/iu.test(cleaned)) return `I can ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
  if (/show|appear|visible|see/iu.test(cleaned)) return `I see ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
  return cleaned;
}

export function reviewChecklist(input: { milestone: Milestone; draftChecklist: string }): ChecklistFeedbackResponse {
  const draftItems = parseChecklistDraft(input.draftChecklist);
  const goodAndCheckable = draftItems
    .filter((item) => !isVagueChecklistItem(item))
    .map((text) => ({
      text,
      reason: "A friend can try it in the preview and answer yes or not yet."
    }));
  const tooVague = draftItems
    .filter(isVagueChecklistItem)
    .map((text) => ({
      text,
      reason: "This is a good goal, but it does not say what should happen on the screen."
    }));
  const covered = new Set<string>();
  for (const item of goodAndCheckable) {
    const best = input.milestone.doneChecklist.find((candidate) => overlapScore(item.text, candidate) > 0);
    if (best) covered.add(best);
  }
  const missing = input.milestone.doneChecklist
    .filter((item) => !covered.has(item))
    .slice(0, Math.max(1, 4 - goodAndCheckable.length))
    .map((text) => ({
      text,
      reason: "This part helps connect the step to the rest of the project."
    }));

  const improvedChecklist = [
    ...goodAndCheckable.map((item) => checkableVersion(item.text)),
    ...missing.map((item) => checkableVersion(item.text))
  ]
    .filter(Boolean)
    .slice(0, 4);

  return {
    engineSource: "fallback",
    goodAndCheckable,
    tooVague,
    missingStep: missing,
    improvedChecklist: improvedChecklist.length > 0 ? improvedChecklist : input.milestone.doneChecklist.slice(0, 4),
    assistantMessage:
      tooVague.length > 0
        ? "Some ideas are good but hard to check. I made them easier to see in the preview."
        : "This checklist is clear enough to share. You can use it or change it."
  };
}

function milestoneText(milestone: Milestone): string {
  return [milestone.title, milestone.visibleOutput, ...milestone.doneChecklist].join(" ").toLowerCase();
}

function compactStudentOption(text: string): string {
  const cleaned = text.replace(/[^\x20-\x7E]/gu, "").replace(/\s+/gu, " ").trim();
  const words = cleaned.split(" ");
  let option = "";
  for (const word of words) {
    const next = option ? `${option} ${word}` : word;
    if (next.length > 32) break;
    option = next;
  }
  return option || "This step works";
}

function proofOptionForMilestone(milestone: Milestone): string {
  const text = milestoneText(milestone);
  if (/score|points/.test(text)) return "The score changes";
  if (/\bthree\b|3 questions|multiple questions|all questions|result|complete/.test(text)) return "More questions work";
  if (/\bcorrect\b|\bincorrect\b|feedback|try again/.test(text)) return "Answer feedback appears";
  if (/question|choice|answer/.test(text)) return "The first question works";
  if (/color|style|look|polish/.test(text)) return "The screen uses colors";
  if (/start|title|beginning/.test(text)) return "The start screen is ready";
  return compactStudentOption(milestone.title);
}

function distractorsForMilestone(milestone: Milestone): string[] {
  const correct = proofOptionForMilestone(milestone);
  return ["The whole game is done", "The app is online", "Only the colors changed", "The final score is done"]
    .filter((option) => option !== correct)
    .slice(0, 2);
}

function logicSketchForMilestone(milestone: Milestone): string[] {
  const fromChecklist = milestone.doneChecklist.slice(0, 4).map((item) => `Show: ${readableChecklistItem(item)}`);
  if (fromChecklist.length >= 2) return fromChecklist;
  return [`Show: ${milestone.title}`, `Check: ${milestone.visibleOutput}`, "Run the preview"];
}

function predictionForMilestone(milestone: Milestone): PredictionQuestion {
  return {
    prompt: "What should you see when this step works?",
    options: [proofOptionForMilestone(milestone), ...distractorsForMilestone(milestone)],
    correctIndex: 0
  };
}

function changeSummaryForMilestone(milestone: Milestone): string[] {
  const summary = milestone.doneChecklist.slice(0, 3).map((item) => `Added: ${readableChecklistItem(item)}`);
  if (summary.length > 0) return summary;
  return [`Added: ${milestone.title}`, `Preview should show: ${milestone.visibleOutput}`];
}

function explainOptionsForMilestone(milestone: Milestone): string[] {
  return [proofOptionForMilestone(milestone), ...distractorsForMilestone(milestone)];
}

function kidConcepts(concepts: string[]): string[] {
  const conceptMap: Record<string, string> = {
    state: "screen choice",
    "mouse event": "click",
    "data display": "showing answers",
    condition: "if rule",
    "selection state": "picked answer",
    variable: "remembered number",
    "state update": "screen change",
    array: "question list",
    index: "which question",
    "results state": "finish screen"
  };

  return concepts.map((concept) => conceptMap[concept] ?? concept);
}

export function planMilestone(milestone: Milestone): MilestonePlanResponse {
  return {
    milestone: {
      ...milestone,
      status: "in_progress"
    },
    logicSketch: logicSketchForMilestone(milestone),
    predictionQuestion: predictionForMilestone(milestone),
    buildPlan: ["Make only this small step", "Run the preview", "Check what you can see"]
  };
}

export function generatePatch(milestone: Milestone): PatchResponse {
  const code = codeForMilestone(milestone);

  return {
    code,
    changeSummary: changeSummaryForMilestone(milestone),
    changedFiles: ["sketch.js"],
    checkpointName: milestone.title,
    miniExplainQuestion: {
      prompt: "What did this step add?",
      options: explainOptionsForMilestone(milestone),
      correctIndex: 0
    },
    learningTraceDelta: {
      conceptsTouched: kidConcepts(milestone.concepts),
      decisionsMade: [`Built milestone: ${milestone.title}`]
    },
    validation: {
      scopedToMilestone: true,
      noFullProjectGeneration: true,
      reason: "This patch changes only the current step and returns one sketch.js snapshot."
    }
  };
}

export function diagnoseDebug(input: {
  visibleBehavior?: string;
  failedChecklistItem?: string;
  milestone?: Milestone;
}): DebugDiagnosisResponse {
  const milestoneTitle = input.milestone?.title ?? "this step";
  const failedChecklistItem = input.failedChecklistItem || input.milestone?.doneChecklist[0] || "The preview does not match the checklist yet";
  const visibleBehavior = input.visibleBehavior || `I see that ${milestoneTitle} is missing one checklist item.`;

  return {
    visibleBehavior,
    failedChecklistItem,
    choices: [
      {
        label: "A click is not changing the screen",
        explanation: "When the player clicks, the preview needs to show the next thing.",
        isLikely: /click|Start|answer|button/i.test(failedChecklistItem)
      },
      {
        label: "The missing part is not drawn",
        explanation: "The question, choices, or message need drawing code before they can be seen.",
        isLikely: /question|choices|display|visible/i.test(failedChecklistItem)
      },
      {
        label: "The feedback rule is missing",
        explanation: "The app needs a small if rule to decide what message to show.",
        isLikely: /feedback|score|result|correct|wrong/i.test(failedChecklistItem)
      }
    ],
    likelyCause: "The preview is missing the code for the checklist item you picked.",
    fixSummary: "Fix only that missing thing, then run the preview again."
  };
}
