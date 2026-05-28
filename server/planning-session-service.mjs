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
    status: "goal_understanding_generated",
    responses: [],
    candidateParts: [],
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
      primaryObject: /jump|跳/i.test(cleanIdea) ? "jumping character" : "game object",
      desiredChange: "player action changes the game",
      likelyOutput: "a playable game screen",
      userActor: "player",
      firstPossibleAction: "press start, choose a character, or take the main action",
      systemResponseHypothesis: "the game responds on screen",
      systemGrammar: {
        actor: "player",
        primaryObject: /jump|跳/i.test(cleanIdea) ? "jumping character" : "game object",
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
  required: ["id", "title", "prompt", "quietAiNote", "choices", "allowFreeText", "allowNotSure"],
  properties: {
    id: { type: "string", enum: ["finished-artifact", "first-user-action", "first-system-response"] },
    title: { type: "string", maxLength: 60 },
    prompt: { type: "string", maxLength: 100 },
    quietAiNote: { type: "string", maxLength: 160 },
    choices: { type: "array", minItems: 3, maxItems: 4, items: planningChoiceSchema },
    allowFreeText: { type: "boolean" },
    allowNotSure: { type: "boolean" }
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
        "quietAI"
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
        quietAI: { type: "string", maxLength: 180 }
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
    allowNotSure: true
  };
}

function normalizeGoalUnderstanding(value, idea) {
  const fallback = inferGoalUnderstanding(idea);
  const lens = planningLensValues.includes(value?.planningLens) ? value.planningLens : fallback.planningLens;
  const confidence = ["high", "medium", "low"].includes(value?.confidence) ? value.confidence : fallback.confidence;
  return {
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

export async function startPlanning(body) {
  const idea = compactText(body.idea ?? body.learnerIdea, 220);
  if (!idea) {
    const error = new Error("idea is required");
    error.status = 400;
    throw error;
  }

  const llm = await tryOpenAI({
    name: "planning_start_response",
    schema: startPlanningSchema,
    user: {
      skill: "goal-understanding",
      learnerIdea: idea,
      rules: [
        "Do not generate a final System Trail.",
        "Do not ask a co-planning question yet.",
        "Infer an internal planning lens and universal system grammar.",
        "Open-ended does not mean generic."
      ]
    },
    fallback: () => ({
      goalUnderstanding: inferGoalUnderstanding(idea),
      assistantMessage: "Check my understanding first. Then we will plan the system together."
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

  const idea = extraDetail && action !== "confirm" ? `${session.idea} ${extraDetail}` : session.idea;
  const goalUnderstanding = action === "confirm"
    ? normalizeGoalUnderstanding(session.goalUnderstanding, session.idea)
    : normalizeGoalUnderstanding(inferGoalUnderstanding(idea), idea);
  const updatedProject = {
    ...project,
    title: goalUnderstanding.projectTitle,
    shortDescription: goalUnderstanding.learnerFacingRestatement,
    updatedAt: now()
  };
  const planningSession = {
    ...session,
    idea,
    status: action === "confirm" ? "goal_understanding_confirmed" : "goal_understanding_generated",
    goalUnderstanding,
    updatedAt: now()
  };

  const currentQuestion = action === "confirm" ? normalizeQuestion(fallbackQuestion(idea, "finished-artifact", goalUnderstanding), "finished-artifact") : null;
  return {
    project: updatedProject,
    planningSession,
    goalUnderstanding,
    currentQuestion,
    assistantMessage: action === "confirm"
      ? "Great. Now we will ask one planning question at a time."
      : "I updated my understanding. Check if this feels right.",
    engineSource: "fallback"
  };
}

export async function answerPlanning(body) {
  const session = body.session;
  const questionId = compactText(body.questionId, 48);
  const answer = compactText(body.answer, 180);
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
    const llm = await tryOpenAI({
      name: "candidate_system_parts_response",
      schema: candidatePartsSchema,
      user: {
        skill: "generate-candidate-system-parts",
        learnerIdea: session.idea,
        goalUnderstanding: session.goalUnderstanding,
        responses,
        rules: [
          "Generate candidates only, not a confirmed trail.",
          "Use visible system capabilities.",
          "For homework helper ideas, keep a learning-support boundary."
        ]
      },
      fallback: () => ({
        candidateParts: fallbackCandidateParts(updatedBase),
        assistantMessage: /homework|helper|agent|study/i.test(session.idea)
          ? "These parts help learning without doing the homework for the learner."
          : "These are possible parts of your system. You can keep, change, remove, or add parts."
      })
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
  const llm = await tryOpenAI({
    name: "planning_question_response",
    schema: answerQuestionSchema,
    user: {
      skill: nextQuestionId === "first-user-action" ? "clarify-first-user-action" : "clarify-first-system-response",
      learnerIdea: session.idea,
      goalUnderstanding: session.goalUnderstanding,
      responses,
      nextQuestionId,
      rules: [
        "Ask exactly one planning question.",
        "Choices must be visible user actions or visible system responses.",
        "Do not generate candidate parts yet."
      ]
    },
    fallback: () => ({
      currentQuestion: fallbackQuestion(session.idea, nextQuestionId, session.goalUnderstanding),
      assistantMessage: "One quick question at a time."
    })
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

  const llm = await tryOpenAI({
    name: "draft_system_trail_response",
    schema: draftTrailSchema,
    user: {
      skill: "assemble-draft-system-trail",
      learnerIdea: session.idea,
      selectedParts: parts,
      rules: [
        "Use only selected parts unless a small connector is required.",
        "This is still a draft.",
        "Preserve student-created or student-edited meaning."
      ]
    },
    fallback: () => ({
      draftTrail: createDraftTrailFromParts(parts),
      assistantMessage: "This is a first version. You can change it before building."
    })
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
  return response({
    sessionId: started.planningSession.id,
    status: "GOAL_UNDERSTANDING_GENERATED",
    allowedActions: ["confirm-understanding"],
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
