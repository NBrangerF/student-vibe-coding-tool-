import { callStructuredOpenAI } from "./openai-service.mjs";

function now() {
  return new Date().toISOString();
}

function compactText(value, maxLength = 160) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function slug(value, fallback = "item") {
  const cleaned = compactText(value, 48)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

function titleFromIdea(idea) {
  if (/drawing|image|style|filter|art|edit|sketch|paint|photo|picture|draw|画|绘画|图片|图像|风格|滤镜|草图|上色|修图/i.test(idea)) {
    return "Drawing Style Tool";
  }
  return compactText(idea, 80)
    .replace(/^i want to make\s+/i, "")
    .replace(/[.?!]+$/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ") || "My Project";
}

function createEmptyProject(idea, title = titleFromIdea(idea)) {
  const timestamp = now();
  return {
    id: `project-${Date.now()}`,
    title,
    originalIdea: idea,
    shortDescription: `A project about: ${idea}`,
    currentFocusNodeId: undefined,
    status: "planning",
    createdAt: timestamp,
    updatedAt: timestamp,
    systemTrail: { nodes: [], edges: [] }
  };
}

function createSession(project, idea, goalUnderstanding = inferGoalUnderstanding(idea)) {
  const timestamp = now();
  return {
    id: `planning-${Date.now()}`,
    projectId: project.id,
    idea,
    status: goalUnderstanding.goalReadiness?.readyForConfirmation ? "goal_understanding_generated" : "goal_understanding_needs_clarification",
    responses: [],
    candidateParts: [],
    goalClarificationTurns: [],
    goalUnderstanding,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function response({ sessionId, status, allowedActions, surface, quietAI, data }) {
  return {
    sessionId,
    status,
    allowedActions,
    uiInstruction: { surface, quietAI },
    data
  };
}

const planningLensValues = [
  "game-interaction",
  "creative-transform-tool",
  "task-organizer",
  "story-world",
  "simulation",
  "learning-helper-agent",
  "content-website",
  "data-dashboard",
  "communication-tool",
  "physical-computing",
  "generic-custom-system"
];

function inferGoalUnderstanding(idea) {
  const cleanIdea = compactText(idea || "I want to make something interactive.", 220);
  const lower = cleanIdea.toLowerCase();
  const base = {
    originalIdea: cleanIdea,
    ambiguityFlags: [],
    safetyOrBoundaryNotes: []
  };

  if (/drawing|image|style|filter|art|edit|sketch|paint|photo|picture|draw|画|绘画|图片|图像|风格|滤镜|草图|上色|修图/i.test(cleanIdea)) {
    return {
      ...base,
      projectTitle: "Drawing Style Tool",
      learnerFacingRestatement: "You want to make a tool where someone adds a drawing, chooses or uses a style, and sees the drawing change.",
      planningLens: "creative-transform-tool",
      confidence: "high",
      primaryObject: "drawing",
      desiredChange: "add a visual style",
      likelyOutput: "styled drawing preview",
      userActor: "someone with a drawing",
      firstPossibleAction: "add a drawing to the tool",
      systemResponseHypothesis: "show the drawing with a new style",
      systemGrammar: {
        actor: "person using the drawing tool",
        primaryObject: "drawing",
        input: "upload, draw, paste, or choose a drawing",
        transformation: "apply a visual style",
        output: "styled drawing preview",
        feedback: "show that the style was applied",
        state: "selected style and current drawing",
        progression: "try another style or adjust the result",
        saveShare: "save or share the styled drawing",
        boundary: null
      },
      ambiguityFlags: [
        "Does the user upload a drawing or draw inside the app?",
        "Does the user choose the style or is it automatic?",
        "Does the tool need before/after comparison?"
      ],
      safetyOrBoundaryNotes: [],
      recommendedCoPlanningStrategy: {
        firstQuestionFocus: "input-source",
        questionSequence: [
          "How should the drawing or image get into the tool?",
          "What change should the tool make?",
          "How should the user see the result?",
          "Which parts belong in your system trail?"
        ]
      },
      quietAI: "This sounds like a creative tool. First, let’s decide how the drawing gets into the tool."
    };
  }

  if (/homework|helper|agent|study|tutor|assignment|learn|作业|学习|辅导|助教/i.test(cleanIdea)) {
    return {
      ...base,
      projectTitle: "Learning Helper",
      learnerFacingRestatement: "You want to make a helper that supports learning without simply doing the work for the learner.",
      planningLens: "learning-helper-agent",
      confidence: "high",
      primaryObject: "student question or attempt",
      desiredChange: "help the learner understand the next step",
      likelyOutput: "a hint, question, explanation, or feedback",
      userActor: "student",
      firstPossibleAction: "ask for help or share what they tried",
      systemResponseHypothesis: "ask what the student tried or give a hint",
      systemGrammar: {
        actor: "student",
        primaryObject: "homework problem or attempt",
        input: "student asks a question or shares their attempt",
        transformation: "helper identifies what support is needed",
        output: "hint, question, explanation, or next step",
        feedback: "encourages the student to try again",
        state: "what the student has already tried",
        progression: "student revises their attempt",
        saveShare: null,
        boundary: "help the learner learn, not complete the work for them"
      },
      ambiguityFlags: ["What kind of help should it give?", "What should it avoid doing?"],
      safetyOrBoundaryNotes: ["This project should help the learner learn, not complete the homework for them."],
      recommendedCoPlanningStrategy: {
        firstQuestionFocus: "system-boundary",
        questionSequence: [
          "What kind of help should the agent give?",
          "What should the learner share first?",
          "What should the helper avoid doing?",
          "Which parts belong in your system trail?"
        ]
      },
      quietAI: "This can be a learning helper. Let’s make sure it supports learning without doing the work."
    };
  }

  if (/jump|arcade|platform|obstacle|runner|game|player|score|maze|跳|街机|游戏|玩家/i.test(cleanIdea)) {
    return {
      ...base,
      projectTitle: titleFromIdea(cleanIdea),
      learnerFacingRestatement: "You want to make a game where a player can do something and see the game respond.",
      planningLens: "game-interaction",
      confidence: "high",
      primaryObject: "game object",
      desiredChange: "player action creates a visible response",
      likelyOutput: "a playable game screen",
      userActor: "player",
      firstPossibleAction: "press start, choose a character, or take the main action",
      systemResponseHypothesis: "the game responds on screen",
      systemGrammar: {
        actor: "player",
        primaryObject: "game object",
        input: "tap, click, press a key, or choose an action",
        transformation: "the game updates after the player's action",
        output: "visible game response",
        feedback: "challenge, score, or success/fail response",
        state: "score, position, level, or game status",
        progression: "next challenge or restart",
        saveShare: null,
        boundary: null
      },
      ambiguityFlags: ["What does the player control?", "What makes the game challenging?"],
      safetyOrBoundaryNotes: [],
      recommendedCoPlanningStrategy: {
        firstQuestionFocus: "artifact-outcome",
        questionSequence: [
          "What should the player be able to do?",
          "What should the player do first?",
          "What should happen after the first action?",
          "Which parts belong in your system trail?"
        ]
      },
      quietAI: "This sounds like a game. Let’s first decide what the player can do."
    };
  }

  if (/task|todo|to-do|club|habit|schedule|team|chores|任务|社团|清单|待办|习惯|日程/i.test(cleanIdea)) {
    return {
      ...base,
      projectTitle: "Task Organizer",
      learnerFacingRestatement: "You want to make a tool that helps people keep track of items and see what changes.",
      planningLens: "task-organizer",
      confidence: "high",
      primaryObject: "tasks or list items",
      desiredChange: "items can be added or marked done",
      likelyOutput: "an updated task list",
      userActor: "person using the organizer",
      firstPossibleAction: "see or add an item",
      systemResponseHypothesis: "the list updates",
      systemGrammar: {
        actor: "organizer user",
        primaryObject: "task or list item",
        input: "add, edit, or choose an item",
        transformation: "item status changes",
        output: "updated list",
        feedback: "done, active, or filtered view",
        state: "task status",
        progression: "filter, sort, or share the list",
        saveShare: "share or save the board",
        boundary: null
      },
      ambiguityFlags: ["What should the user keep track of?", "Should items be shared?"],
      safetyOrBoundaryNotes: [],
      recommendedCoPlanningStrategy: {
        firstQuestionFocus: "artifact-outcome",
        questionSequence: [
          "What should the user keep track of?",
          "What should the user do first?",
          "What should change after the user acts?",
          "Which parts belong in your system trail?"
        ]
      },
      quietAI: "This sounds like an organizer. Let’s decide what people need to track."
    };
  }

  const website = /website|page|portfolio|gallery|blog|site|网页|网站|作品集|画廊/i.test(cleanIdea);
  const story = /story|character|scene|choice|comic|故事|角色|场景|剧情|漫画/i.test(cleanIdea);
  const simulation = /simulation|ecosystem|habitat|weather|planet|climate|simulate|模拟|生态|天气|星球|环境/i.test(cleanIdea);
  const lens = simulation ? "simulation" : story ? "story-world" : website ? "content-website" : "generic-custom-system";
  const confident = lens !== "generic-custom-system";
  return {
    ...base,
    projectTitle: confident ? titleFromIdea(cleanIdea) : titleFromIdea(cleanIdea),
    learnerFacingRestatement: confident
      ? `You want to make a ${lens.replace(/-/g, " ")} where people can see and change something.`
      : "You want to make something where a user works with an object or idea and sees a result.",
    planningLens: lens,
    confidence: confident ? "medium" : "low",
    primaryObject: confident ? "project content or parts" : null,
    desiredChange: confident ? "the system changes based on a user action" : null,
    likelyOutput: confident ? "a visible result" : null,
    userActor: "user",
    firstPossibleAction: null,
    systemResponseHypothesis: null,
    systemGrammar: {
      actor: "user",
      primaryObject: confident ? "project part" : null,
      input: null,
      transformation: null,
      output: confident ? "visible result" : null,
      feedback: null,
      state: null,
      progression: null,
      saveShare: null,
      boundary: null
    },
    ambiguityFlags: ["What is the main thing someone will work with?", "What should change?", "What should the user see?"],
    safetyOrBoundaryNotes: [],
    recommendedCoPlanningStrategy: {
      firstQuestionFocus: "artifact-outcome",
      questionSequence: [
        "What is the main thing someone will work with?",
        "What should change?",
        "What result should appear?",
        "Which parts belong in your system trail?"
      ]
    },
    quietAI: confident
      ? "Let’s turn this idea into visible system parts."
      : "I need one more detail so the planning questions fit your idea."
  };
}

const planningChoiceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "label", "visibleBehavior", "fillsSlot", "systemRole"],
  properties: {
    id: { type: "string", maxLength: 48 },
    label: { type: "string", maxLength: 38 },
    visibleBehavior: { type: "string", maxLength: 140 },
    fillsSlot: { type: "string", maxLength: 32 },
    systemRole: { type: "string", maxLength: 42 }
  }
};

const planningQuestionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "prompt", "quietAiNote", "choices", "allowFreeText", "allowNotSure", "allowMultiple"],
  properties: {
    id: { type: "string", enum: ["finished-artifact", "first-user-action", "first-system-response"] },
    title: { type: "string", maxLength: 60 },
    prompt: { type: "string", maxLength: 100 },
    quietAiNote: { type: "string", maxLength: 160 },
    choices: { type: "array", minItems: 3, maxItems: 4, items: planningChoiceSchema },
    allowFreeText: { type: "boolean" },
    allowNotSure: { type: "boolean" },
    allowMultiple: { type: "boolean" }
  }
};

const goalContractFieldValues = ["learnerGoal", "primaryObject", "actor", "coreMechanic", "endState"];

const goalClarificationChoiceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "label", "detail", "visibleBehavior", "fillsSlot", "systemRole"],
  properties: {
    id: { type: "string", maxLength: 48 },
    label: { type: "string", maxLength: 38 },
    detail: { type: "string", maxLength: 140 },
    visibleBehavior: { type: "string", maxLength: 140 },
    fillsSlot: { type: "string", maxLength: 32 },
    systemRole: { type: "string", maxLength: 42 }
  }
};

const goalClarificationQuestionSchema = {
  anyOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["id", "prompt", "choices", "allowFreeText", "allowNotSure", "targets"],
      properties: {
        id: { type: "string", maxLength: 48 },
        prompt: { type: "string", maxLength: 140 },
        choices: { type: "array", minItems: 2, maxItems: 4, items: goalClarificationChoiceSchema },
        allowFreeText: { type: "boolean" },
        allowNotSure: { type: "boolean" },
        targets: { type: "array", minItems: 1, maxItems: 2, items: { type: "string", enum: goalContractFieldValues } }
      }
    },
    { type: "null" }
  ]
};

const goalContractSchema = {
  type: "object",
  additionalProperties: false,
  required: ["learnerGoal", "primaryObject", "actor", "coreMechanic", "endState"],
  properties: {
    learnerGoal: { type: "string", maxLength: 260 },
    primaryObject: { anyOf: [{ type: "string", maxLength: 100 }, { type: "null" }] },
    actor: { anyOf: [{ type: "string", maxLength: 80 }, { type: "null" }] },
    coreMechanic: { anyOf: [{ type: "string", maxLength: 160 }, { type: "null" }] },
    endState: { anyOf: [{ type: "string", maxLength: 160 }, { type: "null" }] }
  }
};

const goalReadinessSchema = {
  type: "object",
  additionalProperties: false,
  required: ["readyForConfirmation", "missingFields", "confidence", "rationale", "nextQuestion"],
  properties: {
    readyForConfirmation: { type: "boolean" },
    missingFields: { type: "array", maxItems: 5, items: { type: "string", enum: goalContractFieldValues } },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    rationale: { type: "string", maxLength: 180 },
    nextQuestion: goalClarificationQuestionSchema
  }
};

const startPlanningSchema = {
  type: "object",
  additionalProperties: false,
  required: ["goalUnderstanding", "assistantMessage"],
  properties: {
    goalUnderstanding: {
      type: "object",
      additionalProperties: false,
      required: [
        "projectTitle",
        "originalIdea",
        "learnerFacingRestatement",
        "planningLens",
        "confidence",
        "primaryObject",
        "desiredChange",
        "likelyOutput",
        "userActor",
        "firstPossibleAction",
        "systemResponseHypothesis",
        "systemGrammar",
        "ambiguityFlags",
        "safetyOrBoundaryNotes",
        "recommendedCoPlanningStrategy",
        "quietAI",
        "goalContract",
        "goalReadiness"
      ],
      properties: {
        projectTitle: { type: "string", maxLength: 80 },
        originalIdea: { type: "string", maxLength: 220 },
        learnerFacingRestatement: { type: "string", maxLength: 220 },
        planningLens: { type: "string", enum: planningLensValues },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        primaryObject: { anyOf: [{ type: "string", maxLength: 80 }, { type: "null" }] },
        desiredChange: { anyOf: [{ type: "string", maxLength: 100 }, { type: "null" }] },
        likelyOutput: { anyOf: [{ type: "string", maxLength: 100 }, { type: "null" }] },
        userActor: { anyOf: [{ type: "string", maxLength: 80 }, { type: "null" }] },
        firstPossibleAction: { anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }] },
        systemResponseHypothesis: { anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }] },
        systemGrammar: {
          type: "object",
          additionalProperties: false,
          required: ["actor", "primaryObject", "input", "transformation", "output", "feedback", "state", "progression", "saveShare", "boundary"],
          properties: {
            actor: { anyOf: [{ type: "string", maxLength: 80 }, { type: "null" }] },
            primaryObject: { anyOf: [{ type: "string", maxLength: 80 }, { type: "null" }] },
            input: { anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }] },
            transformation: { anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }] },
            output: { anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }] },
            feedback: { anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }] },
            state: { anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }] },
            progression: { anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }] },
            saveShare: { anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }] },
            boundary: { anyOf: [{ type: "string", maxLength: 160 }, { type: "null" }] }
          }
        },
        ambiguityFlags: { type: "array", maxItems: 5, items: { type: "string", maxLength: 140 } },
        safetyOrBoundaryNotes: { type: "array", maxItems: 3, items: { type: "string", maxLength: 180 } },
        recommendedCoPlanningStrategy: {
          type: "object",
          additionalProperties: false,
          required: ["firstQuestionFocus", "questionSequence"],
          properties: {
            firstQuestionFocus: { type: "string", enum: ["artifact-outcome", "first-user-action", "input-source", "transformation", "output-preview", "system-boundary"] },
            questionSequence: { type: "array", minItems: 3, maxItems: 5, items: { type: "string", maxLength: 120 } }
          }
        },
        quietAI: { type: "string", maxLength: 180 },
        goalContract: goalContractSchema,
        goalReadiness: goalReadinessSchema
      }
    },
    assistantMessage: { type: "string", maxLength: 180 }
  }
};

const answerQuestionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["currentQuestion", "assistantMessage"],
  properties: {
    currentQuestion: planningQuestionSchema,
    assistantMessage: { type: "string", maxLength: 180 }
  }
};

const candidatePartSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "visibleBehavior", "systemRole", "selected", "source", "whyItBelongs"],
  properties: {
    id: { type: "string", maxLength: 48 },
    title: { type: "string", maxLength: 42 },
    visibleBehavior: { type: "string", maxLength: 140 },
    systemRole: { type: "string", maxLength: 42 },
    selected: { type: "boolean" },
    source: { type: "string", enum: ["ai-suggested"] },
    whyItBelongs: { type: "string", maxLength: 140 }
  }
};

const candidatePartsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["candidateParts", "assistantMessage"],
  properties: {
    candidateParts: { type: "array", minItems: 5, maxItems: 7, items: candidatePartSchema },
    assistantMessage: { type: "string", maxLength: 180 }
  }
};

const draftNodeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "visibleBehavior", "systemRole", "order", "status", "source"],
  properties: {
    id: { type: "string", maxLength: 48 },
    title: { type: "string", maxLength: 42 },
    visibleBehavior: { type: "string", maxLength: 140 },
    systemRole: { type: "string", maxLength: 42 },
    order: { type: "integer", minimum: 1 },
    status: { type: "string", enum: ["draft"] },
    source: { type: "string", enum: ["student-chosen", "student-edited", "ai-suggested"] }
  }
};

const draftEdgeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["from", "to", "type"],
  properties: {
    from: { type: "string", maxLength: 48 },
    to: { type: "string", maxLength: 48 },
    type: { type: "string", enum: ["sequence", "dependency", "feedback-loop"] }
  }
};

const draftTrailSchema = {
  type: "object",
  additionalProperties: false,
  required: ["draftTrail", "assistantMessage"],
  properties: {
    draftTrail: {
      type: "object",
      additionalProperties: false,
      required: ["nodes", "edges"],
      properties: {
        nodes: { type: "array", minItems: 2, maxItems: 7, items: draftNodeSchema },
        edges: { type: "array", minItems: 1, maxItems: 8, items: draftEdgeSchema }
      }
    },
    assistantMessage: { type: "string", maxLength: 180 }
  }
};

const agentSystemPrompt = `
You are the Goal-to-Milestone AI Companion for G3-9 learners.
You are a systems-first creative programming guide.
Do not assume School Quiz Game.
Do not generate a final System Trail at entry.
Ask one planning question at a time.
Open-ended does not mean generic.
Understand the learner's goal before co-planning.
Do not use generic app verbs like "Open it", "Choose something", or "Try an action" when the idea is understandable.
Do not code before a confirmed trail, selected node, and student checklist.
AI suggestions must be editable and rejectable.
System parts must be visible capabilities, not implementation tasks.
Never use implementation-task language such as function, API, component, variable, conditional, or state logic.
Workflow gates are authoritative.
Treat AI as a quiet sidekick, not the authority.
Return valid JSON only.
`.trim();

function normalizeQuestion(question, fallbackId) {
  const id = question?.id || fallbackId;
  return {
    id,
    title: compactText(question?.title || "Planning question", 60),
    prompt: compactText(question?.prompt || "What should happen next?", 100),
    quietAiNote: compactText(question?.quietAiNote || "This helps make your system visible.", 160),
    choices: (Array.isArray(question?.choices) ? question.choices : [])
      .slice(0, 4)
      .map((choice, index) => ({
        id: compactText(choice.id || `${id}-${index + 1}`, 48),
        label: compactText(choice.label, 38),
        visibleBehavior: compactText(choice.visibleBehavior || choice.label, 140),
        fillsSlot: compactText(choice.fillsSlot || "", 32),
        systemRole: compactText(choice.systemRole || "", 42)
      }))
      .filter((choice) => choice.label)
      .slice(0, 4),
    allowFreeText: true,
    allowNotSure: true,
    allowMultiple: true
  };
}

function normalizeGoalClarificationQuestion(question, fallbackUnderstanding) {
  if (!question) return null;
  const id = compactText(question.id || "goal-core-mechanic", 48);
  const targets = (Array.isArray(question.targets) ? question.targets : ["coreMechanic"])
    .filter((field) => goalContractFieldValues.includes(field))
    .slice(0, 2);
  const choices = (Array.isArray(question.choices) ? question.choices : [])
    .slice(0, 4)
    .map((choice, index) => ({
      id: compactText(choice.id || `${id}-${index + 1}`, 48),
      label: compactText(choice.label, 38),
      visibleBehavior: compactText(choice.visibleBehavior || choice.detail || choice.label, 140),
      detail: compactText(choice.detail || choice.visibleBehavior || "", 140),
      fillsSlot: goalContractFieldValues.includes(choice.fillsSlot) ? choice.fillsSlot : undefined,
      systemRole: compactText(choice.systemRole || "", 42)
    }))
    .filter((choice) => choice.label)
    .slice(0, 4);
  return {
    id,
    prompt: compactText(question.prompt || "What is the main action that makes your project work?", 140),
    choices: choices.length >= 2 ? choices : goalContractQuestion("coreMechanic", fallbackUnderstanding).choices,
    allowFreeText: true,
    allowNotSure: true,
    targets: targets.length ? targets : ["coreMechanic"]
  };
}

function goalChoice(id, label, visibleBehavior) {
  return { id, label, visibleBehavior, detail: visibleBehavior };
}

function goalContractQuestion(field, understanding) {
  if (field === "primaryObject") {
    const choices = [
      goalChoice("object-visible-thing", "A visible thing on screen", "The project works with one main thing someone can see."),
      goalChoice("object-user-content", "Something the user makes or adds", "The user provides or creates the main thing the project changes."),
      goalChoice("object-collection", "A group of items or choices", "The project helps someone work with multiple items, options, or steps.")
    ];
    return {
      id: "goal-primary-object",
      prompt: "What is the main thing your project works with?",
      choices,
      allowFreeText: true,
      allowNotSure: true,
      targets: ["primaryObject"]
    };
  }
  if (field === "coreMechanic") {
    const choices = [
      goalChoice("mechanic-action-change", "An action changes the main thing", "Someone acts, and the project shows a visible change."),
      goalChoice("mechanic-choice-result", "A choice creates a result", "Someone chooses something, and the project shows what happened."),
      goalChoice("mechanic-repeat-progress", "Repeating an action shows progress", "Someone can try again or keep going, and the project tracks what changes.")
    ];
    return {
      id: "goal-core-mechanic",
      prompt: "What is the main action that makes your project work?",
      choices,
      allowFreeText: true,
      allowNotSure: true,
      targets: ["coreMechanic"]
    };
  }
  const choices = [
    goalChoice("end-clear-result", "A clear result appears", "The user sees the result they were trying to make."),
    goalChoice("end-progress-complete", "Progress or completion is visible", "The project shows that someone moved forward or finished."),
    goalChoice("end-save-share", "The result can be kept or shown", "The final result can be saved, shared, or shown to someone else.")
  ];
  return {
    id: "goal-end-state",
    prompt: "How will someone know the project reached its goal?",
    choices,
    allowFreeText: true,
    allowNotSure: true,
    targets: ["endState"]
  };
}

function hasSpecificSignal(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function lowerFirst(value) {
  const text = compactText(value, 220).replace(/[.?!]+$/u, "");
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : text;
}

function goalPredicate(value) {
  const text = lowerFirst(value);
  if (/^(to|a|an|the)\b/u.test(text)) return text;
  if (/^(survive|reach|collect|keep|save|raise|win|finish|avoid|land|unlock|score)\b/u.test(text)) return `to ${text}`;
  return text;
}

function mechanicClause(value) {
  const text = lowerFirst(value);
  if (text.startsWith("jump ")) return `the player jumps ${text.slice("jump ".length)}`;
  if (text.startsWith("land ")) return `the player lands ${text.slice("land ".length)}`;
  if (text.startsWith("collect ")) return `the player collects ${text.slice("collect ".length)}`;
  return text;
}

function primaryObjectFromMechanic(value) {
  const text = compactText(value, 160).toLowerCase();
  if (!text) return null;
  if (/obstacle|spike|enemy|barrier|block/u.test(text)) return "obstacles the player jumps over";
  if (/platform|ledge|ground|floor/u.test(text)) return "platforms the player lands on";
  if (/coin|item|star|gem|collect/u.test(text)) return "items the player collects while jumping";
  if (/gap|hole|pit/u.test(text)) return "gaps the player avoids falling into";
  return null;
}

function inferGoalContract(idea, understanding, turns = []) {
  const combined = [idea, ...turns.map((turn) => turn.answer)].join(" ").replace(/\s+/g, " ").trim();
  const lower = combined.toLowerCase();
  const vague = /^(i want to make\s+)?(a\s+)?(game|app|website|something|something fun|thing)\.?$/i.test(combined.trim());
  const primaryTurn = turns.find((turn) => Array.isArray(turn.targets) && turn.targets.includes("primaryObject"));
  const actorTurn = turns.find((turn) => Array.isArray(turn.targets) && turn.targets.includes("actor"));
  const mechanicTurn = turns.find((turn) => Array.isArray(turn.targets) && turn.targets.includes("coreMechanic"));
  const endTurn = turns.find((turn) => Array.isArray(turn.targets) && turn.targets.includes("endState"));

  let coreMechanic = null;
  if (understanding.planningLens === "creative-transform-tool") coreMechanic = "apply a visual style to a drawing";
  if (hasSpecificSignal(lower, [/feed|feeding|happiness|happy|care|react/, /jump|avoid|score|collect|choose|unlock|move/, /style|filter|transform|change|upload|draw/, /hint|explain|check|revise/])) {
    coreMechanic = understanding.desiredChange ?? "user action changes the project";
  }
  if (mechanicTurn) coreMechanic = mechanicTurn.answer;
  const inferredPrimaryObject = primaryObjectFromMechanic(coreMechanic) ?? primaryObjectFromMechanic(primaryTurn?.answer);

  let endState = null;
  if (understanding.planningLens === "creative-transform-tool") endState = "styled drawing preview";
  if (hasSpecificSignal(lower, [/goal is|win|finish|complete|end|keep|save|share|preview|result|for \d+|score|points|happy for/])) {
    endState = understanding.likelyOutput ?? "a visible result";
  }
  if (endTurn) endState = endTurn.answer;

  const learnerGoal = compactText(
    turns.length && coreMechanic && endState
      ? `${idea.replace(/[.?!]+$/u, "")} where ${mechanicClause(coreMechanic)}, and the goal is ${goalPredicate(endState)}.`
      : combined,
    260
  );

  return {
    learnerGoal,
    primaryObject: inferredPrimaryObject ?? primaryTurn?.answer ?? (vague && understanding.planningLens === "generic-custom-system" ? null : understanding.primaryObject),
    actor: actorTurn?.answer ?? (vague && understanding.planningLens === "generic-custom-system" ? null : understanding.userActor),
    coreMechanic,
    endState
  };
}

function inferGoalReadiness(contract, understanding) {
  const missingFields = [];
  if (!contract.learnerGoal) missingFields.push("learnerGoal");
  if (isThinGoalValue("primaryObject", contract.primaryObject, understanding)) missingFields.push("primaryObject");
  if (isThinGoalValue("coreMechanic", contract.coreMechanic, understanding)) missingFields.push("coreMechanic");
  if (isThinGoalValue("endState", contract.endState, understanding)) missingFields.push("endState");
  const readyForConfirmation = missingFields.length === 0;
  const confidence = readyForConfirmation ? "high" : missingFields.length <= 2 ? "medium" : "low";
  const nextTarget = missingFields.includes("coreMechanic")
    ? "coreMechanic"
    : missingFields.includes("endState")
      ? "endState"
      : missingFields.includes("primaryObject")
        ? "primaryObject"
        : missingFields[0];
  return {
    readyForConfirmation,
    missingFields,
    confidence,
    rationale: readyForConfirmation
      ? "The goal has a concrete project object, a specific mechanic, and a clear success state."
      : "The goal still needs a more specific object, mechanic, or success state before planning.",
    nextQuestion: nextTarget ? goalContractQuestion(nextTarget, understanding) : null
  };
}

function buildGoalClarification(idea, turns = []) {
  const combinedIdea = [idea, ...turns.map((turn) => turn.answer)].join(" ").trim();
  const understanding = inferGoalUnderstanding(combinedIdea || idea);
  const goalContract = inferGoalContract(idea, understanding, turns);
  const goalReadiness = inferGoalReadiness(goalContract, understanding);
  return {
    ...understanding,
    confidence: goalReadiness.confidence,
    goalContract,
    goalReadiness,
    quietAI: goalReadiness.nextQuestion?.prompt ?? "This goal is clear enough to confirm before planning."
  };
}

function isThinGoalValue(field, value, understanding) {
  const text = compactText(value, 220).toLowerCase();
  if (!text || text === "not sure yet" || text === "i'm not sure yet") return true;

  if (field === "primaryObject") {
    if (/^(game object|project part|project content or parts|character or game object)$/u.test(text)) return true;
    if (understanding.planningLens === "game-interaction" && /^jumping (character|game object|player)$/u.test(text)) return true;
  }

  if (field === "coreMechanic") {
    if (/^((player|user) action (changes|creates) (the game|the project|a visible response)|the system reacts|the user changes one thing)$/u.test(text)) return true;
    if (/^player (makes a character )?jump(s)?( while the score (keeps )?(increases|getting higher))?$/u.test(text)) return true;
    if (understanding.planningLens === "game-interaction") {
      const hasAction = /jump|avoid|collect|land|time|tap|move|dodge|survive/u.test(text);
      const hasSpecificConsequence = /obstacle|platform|gap|enemy|spike|coin|item|score|point|fall|miss|collision|survive|timer|finish|level/u.test(text);
      if (!hasAction || !hasSpecificConsequence) return true;
    }
  }

  if (field === "endState") {
    if (/^(a visible result|visible result|playable game screen|a clear result appears)$/u.test(text)) return true;
    if (understanding.planningLens === "game-interaction") {
      const hasGameEnd = /score|point|win|finish|survive|timer|time|level|target|collect|game over|lose|restart|higher|longer/u.test(text);
      if (!hasGameEnd) return true;
    }
  }

  return false;
}

function sanitizeGoalContract(contract, readiness, understanding) {
  const sanitized = { ...contract };
  for (const field of readiness.missingFields ?? []) {
    if (field === "primaryObject" && isThinGoalValue(field, sanitized.primaryObject, understanding)) sanitized.primaryObject = null;
    if (field === "coreMechanic" && isThinGoalValue(field, sanitized.coreMechanic, understanding)) sanitized.coreMechanic = null;
    if (field === "endState" && isThinGoalValue(field, sanitized.endState, understanding)) sanitized.endState = null;
  }
  return sanitized;
}

function normalizeGoalUnderstanding(value, idea, turns = []) {
  const fallback = buildGoalClarification(idea, turns);
  const lens = planningLensValues.includes(value?.planningLens) ? value.planningLens : fallback.planningLens;
  const confidence = ["high", "medium", "low"].includes(value?.confidence) ? value.confidence : fallback.confidence;
  const normalized = {
    projectTitle: compactText(value?.projectTitle || fallback.projectTitle, 80),
    originalIdea: compactText(value?.originalIdea || idea, 220),
    learnerFacingRestatement: compactText(value?.learnerFacingRestatement || fallback.learnerFacingRestatement, 220),
    planningLens: lens,
    confidence,
    primaryObject: value?.primaryObject ?? fallback.primaryObject,
    desiredChange: value?.desiredChange ?? fallback.desiredChange,
    likelyOutput: value?.likelyOutput ?? fallback.likelyOutput,
    userActor: value?.userActor ?? fallback.userActor,
    firstPossibleAction: value?.firstPossibleAction ?? fallback.firstPossibleAction,
    systemResponseHypothesis: value?.systemResponseHypothesis ?? fallback.systemResponseHypothesis,
    systemGrammar: {
      actor: value?.systemGrammar?.actor ?? fallback.systemGrammar.actor ?? null,
      primaryObject: value?.systemGrammar?.primaryObject ?? fallback.systemGrammar.primaryObject ?? null,
      input: value?.systemGrammar?.input ?? fallback.systemGrammar.input ?? null,
      transformation: value?.systemGrammar?.transformation ?? fallback.systemGrammar.transformation ?? null,
      output: value?.systemGrammar?.output ?? fallback.systemGrammar.output ?? null,
      feedback: value?.systemGrammar?.feedback ?? fallback.systemGrammar.feedback ?? null,
      state: value?.systemGrammar?.state ?? fallback.systemGrammar.state ?? null,
      progression: value?.systemGrammar?.progression ?? fallback.systemGrammar.progression ?? null,
      saveShare: value?.systemGrammar?.saveShare ?? fallback.systemGrammar.saveShare ?? null,
      boundary: value?.systemGrammar?.boundary ?? fallback.systemGrammar.boundary ?? null
    },
    ambiguityFlags: (Array.isArray(value?.ambiguityFlags) ? value.ambiguityFlags : fallback.ambiguityFlags).slice(0, 5).map((item) => compactText(item, 140)),
    safetyOrBoundaryNotes: (Array.isArray(value?.safetyOrBoundaryNotes) ? value.safetyOrBoundaryNotes : fallback.safetyOrBoundaryNotes).slice(0, 3).map((item) => compactText(item, 180)),
    recommendedCoPlanningStrategy: {
      firstQuestionFocus: value?.recommendedCoPlanningStrategy?.firstQuestionFocus || fallback.recommendedCoPlanningStrategy.firstQuestionFocus,
      questionSequence: (Array.isArray(value?.recommendedCoPlanningStrategy?.questionSequence)
        ? value.recommendedCoPlanningStrategy.questionSequence
        : fallback.recommendedCoPlanningStrategy.questionSequence).slice(0, 5).map((item) => compactText(item, 120))
    },
    quietAI: compactText(value?.quietAI || fallback.quietAI, 180)
  };
  const rawGoalContract = {
    learnerGoal: compactText(value?.goalContract?.learnerGoal || fallback.goalContract.learnerGoal, 260),
    primaryObject: primaryObjectFromMechanic(value?.goalContract?.coreMechanic) ?? primaryObjectFromMechanic(fallback.goalContract.coreMechanic) ?? value?.goalContract?.primaryObject ?? fallback.goalContract.primaryObject,
    actor: value?.goalContract?.actor ?? fallback.goalContract.actor,
    coreMechanic: value?.goalContract?.coreMechanic ?? fallback.goalContract.coreMechanic,
    endState: value?.goalContract?.endState ?? fallback.goalContract.endState
  };
  const fallbackReadiness = inferGoalReadiness(rawGoalContract, normalized);
  const llmMissingFields = (Array.isArray(value?.goalReadiness?.missingFields) ? value.goalReadiness.missingFields : [])
    .filter((field) => goalContractFieldValues.includes(field));
  const missingFields = Array.from(new Set([...fallbackReadiness.missingFields, ...llmMissingFields]))
    .filter((field) => {
      if (field === "learnerGoal") return !rawGoalContract.learnerGoal;
      if (field === "primaryObject") return isThinGoalValue(field, rawGoalContract.primaryObject, normalized);
      if (field === "coreMechanic") return isThinGoalValue(field, rawGoalContract.coreMechanic, normalized);
      if (field === "endState") return isThinGoalValue(field, rawGoalContract.endState, normalized);
      return false;
    })
    .slice(0, 5);
  const readyForConfirmation = missingFields.length === 0;
  const readinessCore = { ...fallbackReadiness, missingFields, readyForConfirmation };
  const goalContract = sanitizeGoalContract(rawGoalContract, readinessCore, normalized);
  const nextQuestion = normalizeGoalClarificationQuestion(
    readyForConfirmation ? null : fallbackReadiness.nextQuestion ?? value?.goalReadiness?.nextQuestion,
    normalized
  );
  return {
    ...normalized,
    goalContract,
    goalReadiness: {
      readyForConfirmation,
      missingFields,
      confidence: readyForConfirmation ? "high" : fallbackReadiness.confidence,
      rationale: compactText(readyForConfirmation ? (value?.goalReadiness?.rationale || fallbackReadiness.rationale) : fallbackReadiness.rationale, 180),
      nextQuestion
    }
  };
}

function normalizeCandidatePart(part, index) {
  return {
    id: compactText(part.id || `candidate-${index + 1}-${slug(part.title)}`, 48),
    title: compactText(part.title, 42),
    visibleBehavior: compactText(part.visibleBehavior, 140),
    systemRole: compactText(part.systemRole, 42),
    selected: typeof part.selected === "boolean" ? part.selected : true,
    source: part.source === "student-created" || part.source === "student-edited" ? part.source : "ai-suggested",
    whyItBelongs: compactText(part.whyItBelongs || "It is a visible part of the learner's system.", 140)
  };
}

function fallbackQuestion(idea, questionId, goalUnderstanding = inferGoalUnderstanding(idea)) {
  const text = idea.toLowerCase();
  const creative = goalUnderstanding.planningLens === "creative-transform-tool";
  const pet = /pet/.test(text);
  const task = /task|club/.test(text);
  const story = /story|world/.test(text);
  const habitat = /habitat|plant|animal|ecosystem/.test(text);
  const homework = /homework|helper|agent|study/.test(text);
  const game = /jump|arcade|game|player/.test(text);

  if (questionId === "first-user-action") {
    return {
      id: "first-user-action",
      title: creative ? "Choose the style change" : "Find the first action",
      prompt: creative ? "What change should the tool make?" : "What should the user do first?",
      quietAiNote: creative ? "Now we name the transformation your tool will do." : "The first action becomes the entrance to your system.",
      choices: creative
        ? [
          { id: "cartoon-style", label: "Add a cartoon style", visibleBehavior: "The tool makes the drawing look more cartoon-like.", fillsSlot: "transformation", systemRole: "transformation" },
          { id: "watercolor-style", label: "Add a watercolor style", visibleBehavior: "The tool makes the drawing look painted.", fillsSlot: "transformation", systemRole: "transformation" },
          { id: "pixel-art-style", label: "Make it pixel art", visibleBehavior: "The tool turns the drawing into a pixel-art look.", fillsSlot: "transformation", systemRole: "transformation" },
          { id: "choose-style", label: "Let the user choose a style", visibleBehavior: "The user picks which style to apply.", fillsSlot: "input", systemRole: "input" }
        ]
        : homework
        ? [
          { id: "type-help", label: "Type what I need", visibleBehavior: "The learner types what they need help with." },
          { id: "choose-subject", label: "Choose a subject", visibleBehavior: "The learner chooses the subject first." },
          { id: "share-attempt", label: "Share my try", visibleBehavior: "The learner shares what they already tried." }
        ]
        : pet
          ? [
            { id: "choose-food", label: "Choose food", visibleBehavior: "The player chooses food for the pet." },
            { id: "pet-start", label: "Meet the pet", visibleBehavior: "The player sees the pet first." },
            { id: "choose-action", label: "Choose an action", visibleBehavior: "The player chooses what to do with the pet." }
          ]
          : task
            ? [
              { id: "see-list", label: "See task list", visibleBehavior: "The club sees its task list." },
              { id: "add-task", label: "Add a task", visibleBehavior: "The user adds a task." },
              { id: "mark-done", label: "Mark one done", visibleBehavior: "The user marks a task done." }
            ]
            : story
              ? [
                { id: "choose-place", label: "Choose a place", visibleBehavior: "The reader chooses a story place." },
                { id: "meet-character", label: "Meet a character", visibleBehavior: "The reader meets a character." },
                { id: "open-world", label: "Open the world", visibleBehavior: "The reader sees the story world." }
              ]
              : habitat
                ? [
                  { id: "see-habitat", label: "See habitat", visibleBehavior: "The user sees the habitat." },
                  { id: "add-water", label: "Add water", visibleBehavior: "The user changes water in the habitat." },
                  { id: "choose-animal", label: "Choose animal", visibleBehavior: "The user chooses an animal." }
                ]
                : game
          ? [
            { id: "press-start", label: "Press Start", visibleBehavior: "The player starts the game." },
            { id: "tap-jump", label: "Tap to jump", visibleBehavior: "The player makes the character jump." },
            { id: "choose-character", label: "Choose a character", visibleBehavior: "The player picks a character." }
          ]
          : [
            { id: "add-main-thing", label: "Add the main thing", visibleBehavior: "The user adds the thing they want to work with.", fillsSlot: "input", systemRole: "input" },
            { id: "choose-change", label: "Choose a change", visibleBehavior: "The user chooses what should happen to it.", fillsSlot: "transformation", systemRole: "input" },
            { id: "describe-result", label: "Describe the result", visibleBehavior: "The user says what they want to see.", fillsSlot: "output", systemRole: "output" }
          ],
      allowFreeText: true,
      allowNotSure: true
    };
  }

  if (questionId === "first-system-response") {
    return {
      id: "first-system-response",
      title: creative ? "Preview the result" : "Name the first response",
      prompt: creative ? "How should the user see the result?" : "What should the system show or do after that?",
      quietAiNote: creative ? "A preview lets the user check if the style change worked." : "Now we connect the user's action to what the system shows.",
      choices: creative
        ? [
          { id: "styled-preview", label: "Show the styled image", visibleBehavior: "The user sees the drawing with the selected style.", fillsSlot: "output", systemRole: "output" },
          { id: "before-after", label: "Show before and after", visibleBehavior: "The user compares the original and styled drawing.", fillsSlot: "feedback", systemRole: "feedback" },
          { id: "try-another", label: "Let the user try another style", visibleBehavior: "The user can explore a different style result.", fillsSlot: "progression", systemRole: "progression" },
          { id: "adjust-strength", label: "Let the user adjust strength", visibleBehavior: "The user changes how strong the style looks.", fillsSlot: "state", systemRole: "state" }
        ]
        : homework
        ? [
          { id: "ask-tried", label: "Ask what I tried", visibleBehavior: "The helper asks what the learner already tried." },
          { id: "give-hint", label: "Give a hint", visibleBehavior: "The helper gives a learning hint." },
          { id: "explain-step", label: "Explain one step", visibleBehavior: "The helper explains one step without doing all the work." }
        ]
        : pet
          ? [
            { id: "pet-appears", label: "Pet appears", visibleBehavior: "The pet appears on the screen." },
            { id: "pet-reacts", label: "Pet reacts", visibleBehavior: "The pet responds to the player's choice." },
            { id: "happiness-shows", label: "Happiness shows", visibleBehavior: "The player sees how the pet feels." }
          ]
          : task
            ? [
              { id: "list-updates", label: "List updates", visibleBehavior: "The task list changes." },
              { id: "task-appears", label: "Task appears", visibleBehavior: "The new task appears." },
              { id: "done-section", label: "Done section", visibleBehavior: "Completed tasks move to done." }
            ]
            : story
              ? [
                { id: "scene-appears", label: "Scene appears", visibleBehavior: "A story scene appears." },
                { id: "path-changes", label: "Path changes", visibleBehavior: "The story path changes." },
                { id: "choice-result", label: "Choice result", visibleBehavior: "The reader sees what happened." }
              ]
              : habitat
                ? [
                  { id: "habitat-changes", label: "Habitat changes", visibleBehavior: "The habitat visibly changes." },
                  { id: "needs-show", label: "Needs show", visibleBehavior: "The habitat shows what living things need." },
                  { id: "balance-changes", label: "Balance changes", visibleBehavior: "The user sees if the habitat is balanced." }
                ]
        : game
          ? [
            { id: "character-jumps", label: "Character jumps", visibleBehavior: "The character jumps on the screen." },
            { id: "obstacles-move", label: "Obstacles move", visibleBehavior: "Obstacles begin moving." },
            { id: "score-appears", label: "Score appears", visibleBehavior: "A score appears for the player." }
          ]
          : [
            { id: "show-result", label: "Show a result", visibleBehavior: "The system shows a result." },
            { id: "show-reaction", label: "Show a reaction", visibleBehavior: "The system responds to the user's action." },
            { id: "show-next", label: "Show next step", visibleBehavior: "The user sees what to do next." }
          ],
      allowFreeText: true,
      allowNotSure: true
    };
  }

  return {
    id: "finished-artifact",
    title: creative ? "Input source" : goalUnderstanding.confidence === "low" ? "Main thing" : "Imagine it working",
    prompt: creative
      ? "How should the drawing or image get into the tool?"
      : goalUnderstanding.confidence === "low"
        ? "What is the main thing someone will work with?"
        : "When your project is working, what should someone be able to do?",
    quietAiNote: homework
      ? "This project should help you learn, not do the homework for you."
      : creative
        ? "The first action tells us how the drawing enters your tool."
      : "This helps us understand what kind of system you want to build.",
    choices: creative
      ? [
        { id: "upload-drawing", label: "Upload a drawing", visibleBehavior: "The user adds a drawing from their device.", fillsSlot: "input", systemRole: "input" },
        { id: "draw-inside-app", label: "Draw inside the app", visibleBehavior: "The user makes a drawing in the tool.", fillsSlot: "input", systemRole: "input" },
        { id: "pick-sample", label: "Pick a sample drawing", visibleBehavior: "The user chooses a drawing already in the app.", fillsSlot: "input", systemRole: "input" },
        { id: "paste-image", label: "Paste an image", visibleBehavior: "The user pastes an image to style.", fillsSlot: "input", systemRole: "input" }
      ]
      : homework
      ? [
        { id: "ask-help", label: "Ask for help", visibleBehavior: "The learner asks for help with a problem." },
        { id: "get-hints", label: "Get hints", visibleBehavior: "The learner gets hints instead of answers." },
        { id: "check-my-try", label: "Check my try", visibleBehavior: "The learner checks their own attempt." }
      ]
      : pet
        ? [
          { id: "care-for-pet", label: "Care for a pet", visibleBehavior: "The player cares for a pet." },
          { id: "choose-actions", label: "Choose actions", visibleBehavior: "The player chooses what the pet does." },
          { id: "see-pet-react", label: "See pet react", visibleBehavior: "The player sees the pet react." }
        ]
        : task
          ? [
            { id: "see-tasks", label: "See tasks", visibleBehavior: "The club sees its tasks." },
            { id: "add-tasks", label: "Add tasks", visibleBehavior: "The user adds tasks." },
            { id: "finish-tasks", label: "Finish tasks", visibleBehavior: "The user marks tasks done." }
          ]
          : story
            ? [
              { id: "explore-world", label: "Explore a world", visibleBehavior: "The reader explores a story world." },
              { id: "choose-path", label: "Choose a path", visibleBehavior: "The reader chooses where the story goes." },
              { id: "meet-characters", label: "Meet characters", visibleBehavior: "The reader meets story characters." }
            ]
            : habitat
              ? [
                { id: "watch-habitat", label: "Watch habitat", visibleBehavior: "The user watches a habitat change." },
                { id: "change-needs", label: "Change needs", visibleBehavior: "The user changes water, food, or shelter." },
                { id: "see-balance", label: "See balance", visibleBehavior: "The user sees whether the habitat stays balanced." }
              ]
      : game
        ? [
          { id: "control-jump", label: "Control a jumper", visibleBehavior: "The player controls something that jumps." },
          { id: "avoid-obstacles", label: "Avoid obstacles", visibleBehavior: "The player tries not to hit obstacles." },
          { id: "earn-points", label: "Earn points", visibleBehavior: "The player sees points go up." }
        ]
      : [
          { id: "main-object", label: "Work with a main object", visibleBehavior: "The user starts with the main thing this project changes.", fillsSlot: "primary-object", systemRole: "input" },
          { id: "change-something", label: "Change something", visibleBehavior: "The user changes one visible part.", fillsSlot: "transformation", systemRole: "transformation" },
          { id: "see-result", label: "See a result", visibleBehavior: "The user sees what happened after the change.", fillsSlot: "output", systemRole: "output" }
        ],
    allowFreeText: true,
    allowNotSure: true
  };
}

function fallbackCandidateParts(session) {
  const idea = session.idea.toLowerCase();
  let titles;
  if (/drawing|image|style|filter|art|edit|sketch|paint|photo|picture|draw|画|绘画|图片|图像|风格|滤镜|草图|上色|修图/i.test(session.idea)) {
    titles = [
      ["Drawing input", "The user adds or creates a drawing.", "input"],
      ["Style picker", "The user chooses the style they want.", "input"],
      ["Styled preview", "The user sees the drawing with the selected style.", "output"],
      ["Before/after comparison", "The user compares the original drawing with the styled drawing.", "feedback"],
      ["Try another style", "The user can choose a different style and see a new result.", "progression"],
      ["Save styled drawing", "The user saves the styled drawing.", "save-share"]
    ];
  } else if (/pet/.test(idea)) {
    titles = [
      ["Pet appears", "The player sees their pet.", "entry"],
      ["Choose food", "The player chooses what to feed the pet.", "input"],
      ["Pet reacts", "The pet responds to the choice.", "feedback"],
      ["Happiness changes", "The pet's happiness goes up or down.", "state"],
      ["New scene unlocks", "The player can visit a new place.", "navigation"]
    ];
  } else if (/task|club/.test(idea)) {
    titles = [
      ["Task list appears", "The club sees its task list.", "entry"],
      ["Add a task", "A new task appears on the board.", "input"],
      ["Mark task done", "A task moves to done.", "state"],
      ["Filter tasks", "The list shows the tasks the user picks.", "navigation"],
      ["Share task board", "The board can be shared with the club.", "output"]
    ];
  } else if (/homework|helper|agent|study/.test(idea)) {
    titles = [
      ["Ask for help", "The learner asks for help with a problem.", "entry"],
      ["Share my try", "The learner shows what they already tried.", "input"],
      ["Get a hint", "The helper gives a hint, not the final answer.", "feedback"],
      ["Explain one step", "The helper explains one small step.", "output"],
      ["Revise my answer", "The learner improves their own response.", "feedback"]
    ];
  } else if (/jump|arcade/.test(idea)) {
    titles = [
      ["Start screen", "The player sees a start button.", "entry"],
      ["Character appears", "The player sees the character.", "output"],
      ["Jump control", "The character jumps when the player taps.", "input"],
      ["Obstacles move", "Obstacles move toward the character.", "state"],
      ["Bump feedback", "The game shows what happens after a bump.", "feedback"],
      ["Score increases", "The score goes up while the player continues.", "state"]
    ];
  } else {
    titles = [
      ["First screen", "The user sees the project begin.", "entry"],
      ["Choose something", "The user makes a choice.", "input"],
      ["System responds", "The system shows a response.", "feedback"],
      ["Result changes", "A visible result changes.", "state"],
      ["Next step appears", "The user sees what they can do next.", "navigation"]
    ];
  }

  return titles.map(([title, visibleBehavior, systemRole], index) => ({
    id: `candidate-${index + 1}-${slug(title)}`,
    title,
    visibleBehavior,
    systemRole,
    selected: true,
    source: "ai-suggested",
    whyItBelongs: "It is a visible part of the learner's system."
  }));
}

function selectedCandidateParts(session) {
  return (Array.isArray(session.candidateParts) ? session.candidateParts : []).filter((part) => part.selected);
}

function createDraftTrailFromParts(parts) {
  const nodes = parts.map((part, index) => ({
    id: `draft-${index + 1}-${slug(part.title)}`,
    title: compactText(part.title, 42),
    visibleBehavior: compactText(part.visibleBehavior, 140),
    systemRole: compactText(part.systemRole, 42),
    order: index + 1,
    status: "draft",
    source: part.source === "student-edited" || part.source === "student-created" ? "student-edited" : "student-chosen"
  }));
  return {
    nodes,
    edges: nodes.slice(0, -1).map((node, index) => ({
      from: node.id,
      to: nodes[index + 1].id,
      type: index >= 2 ? "feedback-loop" : "sequence"
    }))
  };
}

function buildConfirmedTrail(draftTrail, selectedFirstNodeId) {
  const activeNodes = draftTrail.nodes
    .filter((node) => node.status !== "removed")
    .map((node, index) => ({
      id: node.id,
      title: node.title,
      visibleBehavior: node.visibleBehavior,
      systemRole: node.systemRole,
      status: node.id === selectedFirstNodeId ? "current" : "planned",
      order: index + 1,
      dependencies: index === 0 ? [] : [draftTrail.nodes[index - 1]?.id].filter(Boolean),
      suggestedMilestones: [
        {
          id: `${node.id}-first`,
          title: node.title,
          before: `The project does not show "${node.title}" yet.`,
          after: node.visibleBehavior,
          rationale: "This is a visible system part the learner can test."
        }
      ]
    }));
  return {
    nodes: activeNodes,
    edges: activeNodes.slice(0, -1).map((node, index) => ({
      from: node.id,
      to: activeNodes[index + 1].id,
      type: index >= 2 ? "feedback-loop" : "sequence"
    }))
  };
}

async function tryOpenAI({ name, schema, user, fallback }) {
  if (!process.env.OPENAI_API_KEY) return { ...fallback(), __engineSource: "fallback" };
  try {
    return {
      ...(await callStructuredOpenAI({
      name,
      schema,
      system: agentSystemPrompt,
      user: JSON.stringify(user)
      })),
      __engineSource: "openai"
    };
  } catch (error) {
    console.warn(`[planning-agent] OpenAI ${name} failed; using fallback: ${error.message}`);
    return { ...fallback(), __engineSource: "fallback" };
  }
}

async function requireOpenAI({ name, schema, user }) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is required for co-planning.");
    error.status = 503;
    throw error;
  }
  try {
    return {
      ...(await callStructuredOpenAI({
        name,
        schema,
        system: agentSystemPrompt,
        user: JSON.stringify(user)
      })),
      __engineSource: "openai"
    };
  } catch (error) {
    const requiredError = new Error(`LLM co-planning failed: ${error.message}`);
    requiredError.status = error.status && error.status >= 400 ? error.status : 502;
    throw requiredError;
  }
}

export async function startPlanning(body) {
  const idea = compactText(body.idea ?? body.learnerIdea, 220);
  if (!idea) {
    const error = new Error("idea is required");
    error.status = 400;
    throw error;
  }

  const llm = await tryOpenAI({
    name: "goal_clarification_response",
    schema: startPlanningSchema,
    user: {
      skill: "goal-understanding",
      learnerIdea: idea,
      goalClarificationTurns: [],
      rules: [
        "Do not generate a final System Trail.",
        "Do not ask a co-planning question yet.",
        "First confirm the learner goal contract.",
        "A ready goal must include a specific primaryObject, a specific coreMechanic, and a concrete endState.",
        "actor is context only; do not block readiness only because actor is generic.",
        "Do not mark placeholder phrases as ready when they only say the project, user, or system does something without a concrete action and visible consequence.",
        "For any idea type, clarify the concrete loop: the learner-facing object, the action that affects it, the visible change, and the completion signal.",
        "If not ready, ask exactly one direct or indirect goal clarification question."
      ]
    },
    fallback: () => ({
      goalUnderstanding: buildGoalClarification(idea),
      assistantMessage: "First let’s make the goal clear enough to plan."
    })
  });

  const goalUnderstanding = normalizeGoalUnderstanding(llm.goalUnderstanding, idea);
  const project = createEmptyProject(idea, goalUnderstanding.projectTitle);
  project.shortDescription = goalUnderstanding.learnerFacingRestatement;
  const planningSession = createSession(project, idea, goalUnderstanding);
  return {
    project,
    planningSession,
    goalUnderstanding,
    currentQuestion: null,
    starterCode: "",
    assistantMessage: compactText(llm.assistantMessage, 180),
    engineSource: llm.__engineSource
  };
}

export async function confirmGoalUnderstanding(body) {
  const project = body.project;
  const session = body.session;
  const action = body.action || "confirm";
  const extraDetail = compactText(body.extraDetail ?? body.detail, 220);
  if (!project || !session) {
    const error = new Error("project and session are required");
    error.status = 400;
    throw error;
  }

  const turns = Array.isArray(session.goalClarificationTurns) ? [...session.goalClarificationTurns] : [];
  if (action === "answer-goal-question") {
    const question = body.question ?? session.goalUnderstanding?.goalReadiness?.nextQuestion;
    const answer = compactText(body.answer ?? extraDetail, 220);
    if (!question || !answer) {
      const error = new Error("goal question and answer are required");
      error.status = 400;
      throw error;
    }
    turns.push({
      id: `goal-turn-${Date.now()}`,
      questionId: compactText(question.id, 48),
      prompt: compactText(question.prompt, 140),
      answer,
      source: body.source === "free-input" || body.source === "not-sure" ? body.source : "choice",
      targets: (Array.isArray(question.targets) ? question.targets : ["coreMechanic"]).filter((field) => goalContractFieldValues.includes(field)).slice(0, 2),
      createdAt: now()
    });
  }

  const idea = extraDetail && action === "revise" ? `${session.idea} ${extraDetail}` : session.idea;
  const llm = action === "confirm"
    ? {
      goalUnderstanding: normalizeGoalUnderstanding(session.goalUnderstanding, session.idea, turns),
      assistantMessage: "Great. Now we will ask one planning question at a time.",
      __engineSource: "local-gate"
    }
    : await tryOpenAI({
      name: "goal_clarification_response",
      schema: startPlanningSchema,
      user: {
        skill: "goal-understanding",
        learnerIdea: idea,
        previousGoalUnderstanding: session.goalUnderstanding,
        goalClarificationTurns: turns,
        latestAction: action,
        rules: [
          "Do not generate a final System Trail.",
          "Do not generate candidate system parts.",
          "Do not write code.",
          "A ready goal must include a specific primaryObject, a specific coreMechanic, and a concrete endState.",
          "actor is context only; do not block readiness only because actor is generic.",
          "Do not mark placeholder phrases as ready when they only say the project, user, or system does something without a concrete action and visible consequence.",
          "For any idea type, clarify the concrete loop: the learner-facing object, the action that affects it, the visible change, and the completion signal.",
          "If not ready, ask exactly one next goal clarification question."
        ]
      },
      fallback: () => ({
        goalUnderstanding: buildGoalClarification(idea, turns),
        assistantMessage: "Let’s make the goal a little clearer before planning."
      })
    });

  const goalUnderstanding = normalizeGoalUnderstanding(llm.goalUnderstanding, idea, turns);
  if (action === "confirm" && !goalUnderstanding.goalReadiness?.readyForConfirmation) {
    const error = new Error("Answer the goal question before confirming this goal.");
    error.status = 409;
    throw error;
  }
  const updatedProject = {
    ...project,
    title: goalUnderstanding.projectTitle,
    shortDescription: goalUnderstanding.learnerFacingRestatement,
    updatedAt: now()
  };
  const planningSession = {
    ...session,
    idea,
    status: action === "confirm"
      ? "goal_understanding_confirmed"
      : goalUnderstanding.goalReadiness?.readyForConfirmation
        ? "goal_understanding_generated"
        : "goal_understanding_needs_clarification",
    goalClarificationTurns: turns,
    goalUnderstanding,
    updatedAt: now()
  };

  const firstQuestion = action === "confirm"
    ? await requireOpenAI({
      name: "planning_question_response",
      schema: answerQuestionSchema,
      user: {
        skill: "adaptive-co-planning-question",
        learnerIdea: idea,
        goalUnderstanding,
        responses: [],
        nextQuestionId: "finished-artifact",
        planningDirection: "reverse-from-end-goal",
        rules: [
          "Ask exactly one co-planning question.",
          "This first co-planning question must start from the end goal or final user-visible success state.",
          "Work backward from the learner's Goal Contract toward a simple first milestone.",
          "Choices must be selectable in combination; set allowMultiple to true.",
          "Every choice must describe visible end-state behavior or success evidence.",
          "Do not generate candidate parts, a System Trail, or code."
        ]
      }
    })
    : null;
  const currentQuestion = firstQuestion ? normalizeQuestion(firstQuestion.currentQuestion, "finished-artifact") : null;
  return {
    project: updatedProject,
    planningSession,
    goalUnderstanding,
    currentQuestion,
    assistantMessage: action === "confirm"
      ? compactText(firstQuestion?.assistantMessage || "Start from the end goal, then we will work backward.", 180)
      : compactText(llm.assistantMessage || goalUnderstanding.goalReadiness?.nextQuestion?.prompt || "This goal is ready for you to confirm.", 180),
    engineSource: firstQuestion?.__engineSource ?? llm.__engineSource
  };
}

export async function answerPlanning(body) {
  const session = body.session;
  const questionId = compactText(body.questionId, 48);
  const answer = compactText(body.answer, 320);
  const source = body.source === "free-input" || body.source === "not-sure" ? body.source : "choice";
  if (!session || !questionId || !answer) {
    const error = new Error("session, questionId, and answer are required");
    error.status = 400;
    throw error;
  }
  if (session.status === "started" || session.status === "goal_understanding_generated" || session.status === "goal_understanding_needs_clarification") {
    const error = new Error("Confirm the goal understanding before answering co-planning questions.");
    error.status = 409;
    throw error;
  }
  const expectedQuestionId = session.status === "goal_understanding_confirmed"
    ? "finished-artifact"
    : session.status === "outcome_clarified"
      ? "first-user-action"
      : session.status === "first_action_clarified"
        ? "first-system-response"
        : null;
  if (expectedQuestionId && questionId !== expectedQuestionId) {
    const error = new Error(`Expected answer for ${expectedQuestionId} before ${questionId}.`);
    error.status = 409;
    throw error;
  }

  const responses = [
    ...(Array.isArray(session.responses) ? session.responses : []),
    { id: `response-${Date.now()}`, questionId, answer, source, createdAt: now() }
  ];
  let nextStatus = session.status;
  if (questionId === "finished-artifact") nextStatus = "outcome_clarified";
  if (questionId === "first-user-action") nextStatus = "first_action_clarified";
  if (questionId === "first-system-response") nextStatus = "system_response_clarified";

  const updatedBase = {
    ...session,
    responses,
    status: nextStatus,
    updatedAt: now()
  };

  if (questionId === "first-system-response") {
    const llm = await requireOpenAI({
      name: "candidate_system_parts_response",
      schema: candidatePartsSchema,
      user: {
        skill: "generate-candidate-system-parts",
        learnerIdea: session.idea,
        goalUnderstanding: session.goalUnderstanding,
        responses,
        planningDirection: "reverse-from-end-goal",
        rules: [
          "Generate candidates only, not a confirmed trail.",
          "Use the reverse-planning answers: end goal, prior visible step, then first milestone.",
          "Use visible system capabilities.",
          "Include one simple candidate part that can become the first milestone.",
          "Do not use fallback or generic app parts.",
          "For homework helper ideas, keep a learning-support boundary."
        ]
      }
    });
    const candidateParts = llm.candidateParts.map(normalizeCandidatePart);
    return {
      planningSession: {
        ...updatedBase,
        candidateParts,
        updatedAt: now()
      },
      currentQuestion: null,
      assistantMessage: compactText(llm.assistantMessage, 180),
      engineSource: llm.__engineSource
    };
  }

  const nextQuestionId = questionId === "finished-artifact" ? "first-user-action" : "first-system-response";
  const llm = await requireOpenAI({
    name: "planning_question_response",
    schema: answerQuestionSchema,
    user: {
      skill: nextQuestionId === "first-user-action" ? "clarify-first-user-action" : "clarify-first-system-response",
      learnerIdea: session.idea,
      goalUnderstanding: session.goalUnderstanding,
      responses,
      nextQuestionId,
      planningDirection: "reverse-from-end-goal",
      rules: [
        "Ask exactly one planning question.",
        nextQuestionId === "first-user-action"
          ? "Work one step backward from the end goal: ask what visible condition or system response must happen immediately before the final success."
          : "Work backward to the easiest first milestone: ask what the learner can build first that makes entry into the system visible.",
        "Choices must be selectable in combination; set allowMultiple to true.",
        "Choices must be visible user actions, visible system responses, or first-milestone entry behaviors.",
        "The final co-planning question must help choose a simple first milestone.",
        "Do not generate candidate parts yet."
      ]
    }
  });

  return {
    planningSession: updatedBase,
    currentQuestion: normalizeQuestion(llm.currentQuestion, nextQuestionId),
    assistantMessage: compactText(llm.assistantMessage, 180),
    engineSource: llm.__engineSource
  };
}

export async function createDraft(body) {
  const session = body.session;
  if (!session) {
    const error = new Error("session is required");
    error.status = 400;
    throw error;
  }
  const parts = selectedCandidateParts(session);
  if (!parts.length) {
    const error = new Error("Choose what belongs in your trail first.");
    error.status = 409;
    throw error;
  }

  const llm = await requireOpenAI({
    name: "draft_system_trail_response",
    schema: draftTrailSchema,
    user: {
      skill: "assemble-draft-system-trail",
      learnerIdea: session.idea,
      goalUnderstanding: session.goalUnderstanding,
      responses: session.responses,
      selectedParts: parts,
      planningDirection: "reverse-from-end-goal",
      rules: [
        "Use only selected parts unless a small connector is required.",
        "This is still a draft.",
        "Preserve student-created or student-edited meaning.",
        "Order the draft so the simplest visible first milestone is node 1.",
        "The remaining nodes should progress toward the confirmed end goal."
      ]
    }
  });

  const draftTrail = {
    nodes: llm.draftTrail.nodes.map((node, index) => ({
      ...node,
      id: node.id || `draft-${index + 1}-${slug(node.title)}`,
      order: index + 1,
      status: "draft"
    })),
    edges: llm.draftTrail.edges
  };

  return {
    planningSession: {
      ...session,
      status: "draft_trail_created",
      draftTrail,
      updatedAt: now()
    },
    draftTrail,
    assistantMessage: compactText(llm.assistantMessage, 180),
    engineSource: llm.__engineSource
  };
}

export async function reviewDraft(body) {
  const session = body.session;
  const draftTrail = body.draftTrail;
  if (!session || !draftTrail) {
    const error = new Error("session and draftTrail are required");
    error.status = 400;
    throw error;
  }
  return {
    planningSession: {
      ...session,
      status: "draft_trail_reviewed",
      draftTrail,
      updatedAt: now()
    },
    draftTrail,
    assistantMessage: "Looks ready. Now choose the first small part to build.",
    engineSource: "local-gate"
  };
}

export async function confirmPlanning(body) {
  const project = body.project;
  const session = body.session;
  const draftTrail = body.draftTrail;
  const selectedFirstNodeId = compactText(body.selectedFirstNodeId, 48);
  if (!project || !session || !draftTrail || !selectedFirstNodeId) {
    const error = new Error("project, session, draftTrail, and selectedFirstNodeId are required");
    error.status = 400;
    throw error;
  }
  if (session.status !== "draft_trail_reviewed") {
    const error = new Error("Review the draft trail before confirming.");
    error.status = 409;
    throw error;
  }

  const systemTrail = buildConfirmedTrail(draftTrail, selectedFirstNodeId);
  return {
    project: {
      ...project,
      currentFocusNodeId: selectedFirstNodeId,
      status: "in_progress",
      updatedAt: now(),
      systemTrail
    },
    planningSession: {
      ...session,
      status: "completed",
      draftTrail,
      updatedAt: now()
    },
    assistantMessage: "Your System Trail is ready. Build one part at a time.",
    engineSource: "local-gate"
  };
}

export async function startPlanningSession(body) {
  const started = await startPlanning(body);
  const ready = Boolean(started.goalUnderstanding.goalReadiness?.readyForConfirmation);
  return response({
    sessionId: started.planningSession.id,
    status: ready ? "GOAL_UNDERSTANDING_GENERATED" : "GOAL_UNDERSTANDING_NEEDS_CLARIFICATION",
    allowedActions: ready ? ["confirm-understanding", "revise-understanding"] : ["answer-goal-question", "revise-understanding"],
    surface: "goal-understanding",
    quietAI: started.assistantMessage,
    data: {
      skill: "goal-understanding",
      projectTitle: started.project.title,
      goalUnderstanding: started.goalUnderstanding,
      quietAI: started.assistantMessage
    }
  });
}

export async function advancePlanningSession(body) {
  const status = body.status ?? body.session?.status ?? "IDEA_REFLECTED";
  if (!body.action) {
    const error = new Error("action is required");
    error.status = 400;
    throw error;
  }

  return response({
    sessionId: body.sessionId ?? body.session?.id ?? `planning-${Date.now()}`,
    status,
    allowedActions: ["answer-question"],
    surface: "question",
    quietAI: "Use the learner-reviewed planning API for the UI flow.",
    data: {
      skill: "goal-intake",
      quietAI: "Use /api/planning/start and /api/planning/answer for the full co-planning flow."
    }
  });
}
