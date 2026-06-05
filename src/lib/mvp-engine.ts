import {
  CandidateSystemPart,
  ChecklistFeedbackResponse,
  ClarificationResponse,
  ConfirmedTrailResponse,
  DebugDiagnosisResponse,
  DraftSystemNode,
  DraftSystemTrail,
  DraftTrailResponse,
  GoalClarificationQuestion,
  GoalClarificationTurn,
  GoalContract,
  GoalContractField,
  GoalReadiness,
  GoalUnderstanding,
  GoalInterviewResponse,
  GoalInterviewTurn,
  LogicChainStep,
  MilestonePlanResponse,
  PatchResponse,
  PredictionQuestion,
  PlanningAnswerResponse,
  PlanningChoice,
  PlanningQuestion,
  PlanningResponse,
  PlanningResponseSource,
  PlanningSession,
  PlanningStartResponse,
  PlanningUnderstandingResponse,
  Project,
  ProjectPathMap,
  ProjectPathMapNode,
  ProjectPathResponse,
  SystemEdge,
  SystemNode,
  SystemNodeStatus,
  SystemTrail
} from "@/lib/types";
import { codeForSystemNode, STARTER_CODE } from "@/lib/p5-code";

const ISO_STUB = "2026-05-12T00:00:00.000Z";

type TrailNodeSeed = {
  title: string;
  visibleBehavior: string;
  systemRole: string;
  before: string;
  after: string;
  rationale: string;
  dependencies?: string[];
};

type FixtureSeed = {
  key: string;
  title: string;
  idea: string;
  shortDescription: string;
  match: RegExp;
  nodes: TrailNodeSeed[];
};

function slugId(input: string): string {
  const ascii = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return ascii || "student-project";
}

const projectFixtures: FixtureSeed[] = [
  {
    key: "creative-transform",
    title: "Drawing Style Tool",
    idea: "I want to make software that automatically adds a style to my drawing.",
    shortDescription: "A creative tool where someone adds a drawing, chooses a style, previews the result, and saves it.",
    match: /drawing|image|style|filter|art|edit|sketch|paint|photo|picture|draw|画|绘画|图片|图像|风格|滤镜|草图|上色|修图/i,
    nodes: [
      {
        title: "Drawing input",
        visibleBehavior: "The user adds or creates a drawing in the tool.",
        systemRole: "input",
        before: "The tool has no drawing to change.",
        after: "A drawing is visible and ready to style.",
        rationale: "The system needs a visible input before it can transform anything."
      },
      {
        title: "Style picker",
        visibleBehavior: "The user chooses the style they want to try.",
        systemRole: "input",
        before: "The drawing has no chosen style.",
        after: "The tool knows which style to apply.",
        rationale: "A style choice connects the user's goal to the transformation.",
        dependencies: ["node-1"]
      },
      {
        title: "Styled preview",
        visibleBehavior: "The user sees the drawing with the selected style applied.",
        systemRole: "output",
        before: "The user only sees the original drawing.",
        after: "The user sees a styled version of the drawing.",
        rationale: "A preview makes the transformation visible.",
        dependencies: ["node-2"]
      },
      {
        title: "Before/after comparison",
        visibleBehavior: "The user compares the original drawing with the styled drawing.",
        systemRole: "feedback",
        before: "The user cannot clearly tell what changed.",
        after: "The user sees the original and styled versions side by side.",
        rationale: "Comparison helps the user understand the system's change.",
        dependencies: ["node-3"]
      },
      {
        title: "Try another style",
        visibleBehavior: "The user can choose another style and see a new result.",
        systemRole: "progression",
        before: "The user can only see one style result.",
        after: "The user can explore different style outcomes.",
        rationale: "Trying again turns one transformation into an exploratory system.",
        dependencies: ["node-4"]
      },
      {
        title: "Save styled drawing",
        visibleBehavior: "The user saves the styled drawing.",
        systemRole: "save-share",
        before: "The styled drawing only exists in the preview.",
        after: "The user can keep the styled drawing.",
        rationale: "Saving lets the system produce something useful beyond the preview.",
        dependencies: ["node-5"]
      }
    ]
  },
  {
    key: "jumping-arcade",
    title: "Jumping Arcade Game",
    idea: "I want to make a jumping arcade game.",
    shortDescription: "A small arcade game where a character jumps, avoids obstacles, and earns points.",
    match: /jump|arcade|platform|obstacle|runner|跳|街机/i,
    nodes: [
      {
        title: "Start screen",
        visibleBehavior: "The player sees a welcome screen and can start the game.",
        systemRole: "system entry",
        before: "The game has no clear beginning.",
        after: "The player sees how to begin.",
        rationale: "A clear start gives the game a first visible part."
      },
      {
        title: "Character appears",
        visibleBehavior: "The player sees the character on the game screen.",
        systemRole: "system output",
        before: "There is no character to control.",
        after: "The player sees who they are controlling.",
        rationale: "A visible character makes the game playable.",
        dependencies: ["node-1"]
      },
      {
        title: "Jump control",
        visibleBehavior: "The character jumps when the player taps or presses a key.",
        systemRole: "user action",
        before: "The character stays still.",
        after: "The player can make the character jump.",
        rationale: "Jumping connects player action to system response.",
        dependencies: ["node-2"]
      },
      {
        title: "Obstacles move",
        visibleBehavior: "Obstacles move toward the character.",
        systemRole: "system change",
        before: "There is nothing to avoid.",
        after: "The game has a moving challenge.",
        rationale: "Moving obstacles create the arcade loop.",
        dependencies: ["node-3"]
      },
      {
        title: "Collision feedback",
        visibleBehavior: "The game shows what happened when the character hits or avoids an obstacle.",
        systemRole: "feedback",
        before: "The player cannot tell if a jump worked.",
        after: "The game shows success or a miss.",
        rationale: "Feedback helps the player understand the result.",
        dependencies: ["node-4"]
      },
      {
        title: "Score changes",
        visibleBehavior: "The score changes when the player avoids obstacles.",
        systemRole: "state",
        before: "The game does not remember progress.",
        after: "The score shows how the player is doing.",
        rationale: "Score turns repeated jumps into a system.",
        dependencies: ["node-5"]
      }
    ]
  },
  {
    key: "homework-helper",
    title: "Homework Helper Agent",
    idea: "I want to make a homework helper agent.",
    shortDescription: "A study helper that gives hints, asks what was tried, and supports learning.",
    match: /homework|helper|agent|study|tutor|assignment|作业|学习|辅导/i,
    nodes: [
      {
        title: "Ask for help",
        visibleBehavior: "The learner can type what they need help understanding.",
        systemRole: "input",
        before: "The helper does not know what the learner is working on.",
        after: "The learner shares the problem or question.",
        rationale: "The system starts by listening to the learner."
      },
      {
        title: "Share what I tried",
        visibleBehavior: "The helper asks the learner to show their attempt or thinking.",
        systemRole: "learning boundary",
        before: "The helper might answer too quickly.",
        after: "The helper learns what the student already tried.",
        rationale: "This keeps the project helpful without doing homework for the learner.",
        dependencies: ["node-1"]
      },
      {
        title: "Give a hint",
        visibleBehavior: "The helper gives one hint instead of the final answer.",
        systemRole: "feedback",
        before: "The learner may feel stuck.",
        after: "The learner gets a next step to try.",
        rationale: "Hints support learning and keep the student in charge.",
        dependencies: ["node-2"]
      },
      {
        title: "Check understanding",
        visibleBehavior: "The learner can say if the hint helped or ask for another hint.",
        systemRole: "feedback-loop",
        before: "The helper does not know if the hint worked.",
        after: "The helper responds to the learner's understanding.",
        rationale: "Checking understanding makes the helper a learning system.",
        dependencies: ["node-3"]
      },
      {
        title: "Revise and respond",
        visibleBehavior: "The helper helps the learner improve their own answer.",
        systemRole: "system growth",
        before: "The learner has a hint but no revision step.",
        after: "The learner can improve their work in their own words.",
        rationale: "Revision connects help to student ownership.",
        dependencies: ["node-4"]
      }
    ]
  },
  {
    key: "pet",
    title: "Pet Adventure Game",
    idea: "I want to make a pet adventure game.",
    shortDescription: "A small game where a pet reacts to the player's choices.",
    match: /pet|animal|puppy|cat|dog|adventure|宠物|动物/i,
    nodes: [
      {
        title: "Pet appears",
        visibleBehavior: "The player sees their pet on the screen.",
        systemRole: "system entry",
        before: "The player does not know who the adventure is about.",
        after: "The player sees a pet and knows who they are helping.",
        rationale: "A visible character makes the project feel alive."
      },
      {
        title: "Choose food",
        visibleBehavior: "The player chooses what to feed the pet.",
        systemRole: "user action",
        before: "The player can look at the pet but cannot do anything yet.",
        after: "The player can pick one food or action.",
        rationale: "A choice lets the player affect the system.",
        dependencies: ["node-1"]
      },
      {
        title: "Pet reacts",
        visibleBehavior: "The pet responds to the player's choice.",
        systemRole: "feedback",
        before: "Choosing food does not change what the pet does.",
        after: "The pet shows a happy, surprised, or unsure reaction.",
        rationale: "Reaction shows that the player's choice mattered.",
        dependencies: ["node-2"]
      },
      {
        title: "Happiness changes",
        visibleBehavior: "The pet's happiness goes up or down.",
        systemRole: "state",
        before: "The game does not remember how the pet feels.",
        after: "The screen shows the pet's happiness changing.",
        rationale: "A remembered value makes the system grow.",
        dependencies: ["node-3"]
      },
      {
        title: "New scene unlocks",
        visibleBehavior: "The player can visit a new place after helping the pet.",
        systemRole: "system growth",
        before: "The adventure stays in one place.",
        after: "A new scene becomes available.",
        rationale: "Unlocking a place connects one step to the next.",
        dependencies: ["node-4"]
      }
    ]
  },
  {
    key: "club",
    title: "Club Task App",
    idea: "I want to make an app for my club tasks.",
    shortDescription: "A simple app that helps a club see and finish shared tasks.",
    match: /club|task|todo|to-do|team|chores|任务|社团|清单/i,
    nodes: [
      {
        title: "Task list appears",
        visibleBehavior: "The club can see its current task list.",
        systemRole: "system entry",
        before: "The club tasks are not visible in the app.",
        after: "The app shows the tasks in one list.",
        rationale: "A visible list gives the system a shared starting point."
      },
      {
        title: "Add a task",
        visibleBehavior: "A learner can type a new task and add it to the list.",
        systemRole: "input",
        before: "The list cannot grow.",
        after: "A new task appears after it is added.",
        rationale: "Adding items lets the user change the system.",
        dependencies: ["node-1"]
      },
      {
        title: "Mark task done",
        visibleBehavior: "A task moves into a done state.",
        systemRole: "state change",
        before: "All tasks look the same.",
        after: "Completed tasks look different from active tasks.",
        rationale: "Done status helps people see progress.",
        dependencies: ["node-2"]
      },
      {
        title: "Filter tasks",
        visibleBehavior: "The learner can show all, active, or done tasks.",
        systemRole: "view control",
        before: "Every task is shown together.",
        after: "The list changes based on the chosen filter.",
        rationale: "Filters show that one system can have different views.",
        dependencies: ["node-3"]
      },
      {
        title: "Share task board",
        visibleBehavior: "The board is ready to show to club members.",
        systemRole: "output",
        before: "The task board is only for the builder.",
        after: "The board has a clear share view.",
        rationale: "Sharing connects the project to real people.",
        dependencies: ["node-4"]
      }
    ]
  },
  {
    key: "story",
    title: "Story World Website",
    idea: "I want to make a story world website.",
    shortDescription: "An interactive world where readers explore places and characters.",
    match: /story|world|website|character|comic|page|故事|世界|网页/i,
    nodes: [
      {
        title: "World opens",
        visibleBehavior: "The reader sees the name and mood of the story world.",
        systemRole: "system entry",
        before: "The story world has no first view.",
        after: "The reader sees where the story begins.",
        rationale: "A clear opening helps the reader enter the system."
      },
      {
        title: "Choose a place",
        visibleBehavior: "The reader picks a place to explore.",
        systemRole: "user action",
        before: "The reader cannot choose where to go.",
        after: "The reader can choose one place in the world.",
        rationale: "Places show that the world has connected parts.",
        dependencies: ["node-1"]
      },
      {
        title: "Character appears",
        visibleBehavior: "A character connected to that place appears.",
        systemRole: "system output",
        before: "Places do not reveal characters yet.",
        after: "The chosen place shows a matching character.",
        rationale: "Characters make the world respond to choices.",
        dependencies: ["node-2"]
      },
      {
        title: "Story choice changes path",
        visibleBehavior: "A reader choice changes what happens next.",
        systemRole: "feedback loop",
        before: "The story continues the same way every time.",
        after: "The reader sees a different next moment based on a choice.",
        rationale: "Branching helps students see cause and effect.",
        dependencies: ["node-3"]
      },
      {
        title: "World map updates",
        visibleBehavior: "The map shows which places were visited.",
        systemRole: "memory",
        before: "The site does not remember where the reader has been.",
        after: "Visited places look marked on the world map.",
        rationale: "Memory turns separate pages into one system.",
        dependencies: ["node-4"]
      }
    ]
  },
  {
    key: "habitat",
    title: "Habitat Simulation",
    idea: "I want to make a habitat simulation.",
    shortDescription: "A small simulation where parts of a habitat affect each other.",
    match: /habitat|simulation|ecosystem|plant|water|climate|环境|生态|模拟/i,
    nodes: [
      {
        title: "Habitat appears",
        visibleBehavior: "The learner sees the habitat and its main parts.",
        systemRole: "system entry",
        before: "The habitat is only an idea.",
        after: "The screen shows the habitat space.",
        rationale: "Visible parts make the system easier to reason about."
      },
      {
        title: "Add a living thing",
        visibleBehavior: "A plant or animal appears in the habitat.",
        systemRole: "input",
        before: "The habitat has no living thing to observe.",
        after: "One living thing is visible.",
        rationale: "Adding a part gives the system something to change.",
        dependencies: ["node-1"]
      },
      {
        title: "Need changes",
        visibleBehavior: "Water, food, or light changes a visible need.",
        systemRole: "state change",
        before: "Nothing in the habitat changes over time.",
        after: "A need meter or label changes.",
        rationale: "Changing needs show relationships in the system.",
        dependencies: ["node-2"]
      },
      {
        title: "Living thing reacts",
        visibleBehavior: "The plant or animal responds to the habitat condition.",
        systemRole: "feedback",
        before: "The living thing does not react to the habitat.",
        after: "The reaction shows if the condition helps or hurts.",
        rationale: "Reaction helps learners compare cause and effect.",
        dependencies: ["node-3"]
      },
      {
        title: "Balance message appears",
        visibleBehavior: "The simulation tells what changed in the habitat balance.",
        systemRole: "system explanation",
        before: "The learner has to guess what the change means.",
        after: "The screen names the system change.",
        rationale: "A message helps connect observation to systems thinking.",
        dependencies: ["node-4"]
      }
    ]
  },
  {
    key: "quiz",
    title: "School Quiz Game",
    idea: "I want to make a quiz game about my school.",
    shortDescription: "A quiz game where players answer school questions and get feedback.",
    match: /quiz|trivia|question|school|answer|score|问答|测验|学校|题/i,
    nodes: [
      {
        title: "Start screen",
        visibleBehavior: "The player sees the title and a Start button.",
        systemRole: "system entry",
        before: "The quiz has no clear beginning.",
        after: "The player sees a title and Start button.",
        rationale: "A clear start helps players know how to begin."
      },
      {
        title: "One question",
        visibleBehavior: "The player sees one question with answer choices.",
        systemRole: "input",
        before: "The player cannot answer anything yet.",
        after: "The player can choose an answer.",
        rationale: "One question creates the first playable loop.",
        dependencies: ["node-1"]
      },
      {
        title: "Answer feedback",
        visibleBehavior: "The player sees whether the answer is correct or needs another try.",
        systemRole: "feedback",
        before: "Clicking an answer does not tell the player anything.",
        after: "Clicking an answer shows Correct or Try again.",
        rationale: "Feedback helps players learn what happened.",
        dependencies: ["node-2"]
      },
      {
        title: "Score",
        visibleBehavior: "The score changes when the player answers correctly.",
        systemRole: "state",
        before: "The game does not remember points yet.",
        after: "Correct answers change the score.",
        rationale: "Score shows how the system remembers progress.",
        dependencies: ["node-3"]
      },
      {
        title: "More questions",
        visibleBehavior: "The quiz moves through more questions and shows a result.",
        systemRole: "system growth",
        before: "The quiz only has one short path.",
        after: "The quiz has multiple questions and a result.",
        rationale: "More questions turn one loop into a fuller system.",
        dependencies: ["node-4"]
      }
    ]
  }
];

const genericSeed: FixtureSeed = {
  key: "generic",
  title: "Creative Project",
  idea: "I want to make something interactive.",
  shortDescription: "An open project with visible parts that respond to the learner.",
  match: /.^/,
  nodes: [
    {
      title: "First view appears",
      visibleBehavior: "The learner sees the first screen of the project.",
      systemRole: "system entry",
      before: "The idea is not visible yet.",
      after: "The first visible part appears on screen.",
      rationale: "A first view makes the project real."
    },
    {
      title: "User makes a choice",
      visibleBehavior: "The user can click, tap, type, or choose something.",
      systemRole: "user action",
      before: "The project can be seen but not changed.",
      after: "The user has one clear action to try.",
      rationale: "A choice lets the user affect the system.",
      dependencies: ["node-1"]
    },
    {
      title: "System responds",
      visibleBehavior: "The project changes after the user's choice.",
      systemRole: "feedback",
      before: "The user's choice does not change anything yet.",
      after: "The screen changes so the user knows something happened.",
      rationale: "Response connects an action to a result.",
      dependencies: ["node-2"]
    },
    {
      title: "Progress is remembered",
      visibleBehavior: "The project remembers a score, state, place, or choice.",
      systemRole: "state",
      before: "The project forgets what happened.",
      after: "One visible part shows what the system remembers.",
      rationale: "Memory turns a one-time reaction into a system.",
      dependencies: ["node-3"]
    },
    {
      title: "Next part opens",
      visibleBehavior: "A new screen, scene, or option appears.",
      systemRole: "system growth",
      before: "The project stops after one response.",
      after: "The user can continue to another part.",
      rationale: "A next part shows how the system grows.",
      dependencies: ["node-4"]
    }
  ]
};

export const sampleProjectFixtures = projectFixtures.map((fixture) => ({
  title: fixture.title,
  originalIdea: fixture.idea,
  shortDescription: fixture.shortDescription,
  systemTrail: buildSystemTrail(fixture)
}));

function fixtureForIdea(idea: string): FixtureSeed {
  return projectFixtures.find((fixture) => fixture.match.test(idea)) ?? {
    ...genericSeed,
    title: titleFromIdea(idea)
  };
}

function titleFromIdea(idea: string): string {
  const lower = idea.toLowerCase();
  if (/drawing|image|style|filter|art|edit|sketch|paint|photo|picture|draw|画|绘画|图片|图像|风格|滤镜|草图|上色|修图/i.test(idea)) return "Drawing Style Tool";
  if (/pet|animal|adventure/.test(lower)) return "Pet Adventure Game";
  if (/club|task|todo|team/.test(lower)) return "Club Task App";
  if (/story|world|website|character/.test(lower)) return "Story World Website";
  if (/habitat|simulation|ecosystem/.test(lower)) return "Habitat Simulation";
  if (/quiz|school|question|trivia/.test(lower)) return "School Quiz Game";
  const words = idea
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !/^(want|make|with|about|that|this|into|app|game)$/i.test(word))
    .slice(0, 3);
  if (!words.length) return "Creative Project";
  return `${words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ")} Project`;
}

function buildSystemTrail(fixture: FixtureSeed): SystemTrail {
  const nodes: SystemNode[] = fixture.nodes.map((node, index) => {
    const id = `node-${index + 1}`;
    return {
      id,
      title: node.title,
      visibleBehavior: node.visibleBehavior,
      systemRole: node.systemRole,
      order: index + 1,
      status: index === 0 ? "current" : "planned",
      dependencies: node.dependencies,
      suggestedMilestones: [
        {
          id: `${id}-m1`,
          title: node.title,
          before: node.before,
          after: node.after,
          rationale: node.rationale
        }
      ]
    };
  });
  const edges: SystemEdge[] = nodes.slice(0, -1).map((node, index) => ({
    from: node.id,
    to: nodes[index + 1].id,
    type: index >= 2 ? "feedback-loop" : "sequence"
  }));
  return { nodes, edges };
}

export function generateSystemTrailFromIdea(idea: string): SystemTrail {
  return buildSystemTrail(fixtureForIdea(idea));
}

export function createProjectFromIdea(idea: string): Project {
  const cleanIdea = idea.trim() || "I want to make something interactive.";
  const fixture = fixtureForIdea(cleanIdea);
  const title = fixture.key === "generic" ? titleFromIdea(cleanIdea) : fixture.title;
  return {
    id: `project-${slugId(title)}`,
    title,
    originalIdea: cleanIdea,
    shortDescription: fixture.key === "generic" ? `A project about: ${cleanIdea}` : fixture.shortDescription,
    currentFocusNodeId: undefined,
    status: "planning",
    createdAt: ISO_STUB,
    updatedAt: ISO_STUB,
    systemTrail: { nodes: [], edges: [] }
  };
}

export function createProjectPath(idea: string): ProjectPathResponse {
  const projectShell = createProjectFromIdea(idea);
  const systemTrail = generateSystemTrailFromIdea(projectShell.originalIdea);
  const project: Project = {
    ...projectShell,
    currentFocusNodeId: systemTrail.nodes[0]?.id,
    status: "trail_generated",
    systemTrail
  };
  return {
    engineSource: "fallback",
    project,
    starterCode: STARTER_CODE,
    assistantMessage: "Draft trail started. Review it before building."
  };
}

function matchesAny(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

export function inferGoalUnderstanding(idea: string): GoalUnderstanding {
  const cleanIdea = idea.trim() || "I want to make something interactive.";
  const text = cleanIdea.toLowerCase();
  const base = {
    originalIdea: cleanIdea,
    ambiguityFlags: [] as string[],
    safetyOrBoundaryNotes: [] as string[]
  };

  if (matchesAny(cleanIdea, /drawing|image|style|filter|art|edit|sketch|paint|photo|picture|draw|画|绘画|图片|图像|风格|滤镜|草图|上色|修图/i)) {
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

  if (matchesAny(text, /jump|arcade|platform|obstacle|runner|game|player|score|maze|跳|街机|游戏|玩家/)) {
    return {
      ...base,
      projectTitle: titleFromIdea(cleanIdea),
      learnerFacingRestatement: "You want to make a game where a player can do something and see the game respond.",
      planningLens: "game-interaction",
      confidence: "high",
      primaryObject: /jump|跳/.test(text) ? "jumping character" : "game object",
      desiredChange: "player action changes the game",
      likelyOutput: "a playable game screen",
      userActor: "player",
      firstPossibleAction: "press start, choose a character, or take the main action",
      systemResponseHypothesis: "the game responds on screen",
      systemGrammar: {
        actor: "player",
        primaryObject: /jump|跳/.test(text) ? "jumping character" : "game object",
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

  if (matchesAny(text, /task|todo|to-do|club|habit|schedule|team|chores|任务|社团|清单|待办|习惯|日程/)) {
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

  if (matchesAny(text, /homework|helper|agent|study|tutor|assignment|learn|作业|学习|辅导|助教/)) {
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

  if (matchesAny(text, /story|character|scene|choice|comic|故事|角色|场景|剧情|漫画/)) {
    return {
      ...base,
      projectTitle: "Story World",
      learnerFacingRestatement: "You want to make a story system where choices, scenes, or characters connect.",
      planningLens: "story-world",
      confidence: "high",
      primaryObject: "story world",
      desiredChange: "choices change what happens next",
      likelyOutput: "a scene, character, or next story path",
      userActor: "reader",
      firstPossibleAction: "choose a place, character, or story option",
      systemResponseHypothesis: "show the next scene or consequence",
      systemGrammar: {
        actor: "reader",
        primaryObject: "story scene or character",
        input: "choose a path or action",
        transformation: "story path changes",
        output: "next scene or character response",
        feedback: "consequence of the choice",
        state: "visited places or choices made",
        progression: "next scene",
        saveShare: null,
        boundary: null
      },
      ambiguityFlags: ["What should the reader choose first?"],
      safetyOrBoundaryNotes: [],
      recommendedCoPlanningStrategy: {
        firstQuestionFocus: "artifact-outcome",
        questionSequence: ["What should the reader explore?", "What should they choose first?", "What happens after a choice?", "Which parts belong in your system trail?"]
      },
      quietAI: "This sounds like a story world. Let’s decide how choices shape it."
    };
  }

  if (matchesAny(text, /simulation|ecosystem|habitat|weather|planet|climate|simulate|模拟|生态|天气|星球|环境/)) {
    return {
      ...base,
      projectTitle: "Simulation",
      learnerFacingRestatement: "You want to make a system where parts change over time and people can observe what happens.",
      planningLens: "simulation",
      confidence: "high",
      primaryObject: "simulation parts",
      desiredChange: "rules change what happens over time",
      likelyOutput: "visible changes in the simulation",
      userActor: "observer or explorer",
      firstPossibleAction: "add or change one part",
      systemResponseHypothesis: "the simulation visibly changes",
      systemGrammar: {
        actor: "observer",
        primaryObject: "simulation entity",
        input: "add or adjust a part",
        transformation: "rules update the system",
        output: "visible change over time",
        feedback: "message, meter, or reaction",
        state: "condition or balance",
        progression: "observe the next change",
        saveShare: null,
        boundary: null
      },
      ambiguityFlags: ["Which part should change first?"],
      safetyOrBoundaryNotes: [],
      recommendedCoPlanningStrategy: {
        firstQuestionFocus: "artifact-outcome",
        questionSequence: ["What should someone observe?", "What should they change first?", "What should react?", "Which parts belong in your system trail?"]
      },
      quietAI: "This sounds like a simulation. Let’s decide what changes and what the user observes."
    };
  }

  if (matchesAny(text, /website|page|portfolio|gallery|blog|site|网页|网站|作品集|画廊/)) {
    return {
      ...base,
      projectTitle: "Content Website",
      learnerFacingRestatement: "You want to make a site where people can view content and move between parts.",
      planningLens: "content-website",
      confidence: "medium",
      primaryObject: "page content",
      desiredChange: "people can navigate and view content",
      likelyOutput: "a page, gallery, or section",
      userActor: "visitor",
      firstPossibleAction: "open a page or choose a section",
      systemResponseHypothesis: "show the selected content",
      systemGrammar: {
        actor: "visitor",
        primaryObject: "content",
        input: "choose a page, section, or item",
        transformation: "navigation changes the view",
        output: "selected content appears",
        feedback: "active page or selected item",
        state: "current page",
        progression: "next page or section",
        saveShare: "share the site",
        boundary: null
      },
      ambiguityFlags: ["What content should appear first?"],
      safetyOrBoundaryNotes: [],
      recommendedCoPlanningStrategy: {
        firstQuestionFocus: "artifact-outcome",
        questionSequence: ["What should visitors see?", "What should they choose first?", "What content appears after that?", "Which parts belong in your system trail?"]
      },
      quietAI: "This sounds like a website. Let’s decide what visitors should see first."
    };
  }

  return {
    ...base,
    projectTitle: titleFromIdea(cleanIdea),
    learnerFacingRestatement: `You want to make something where a user works with an object or idea and sees a result.`,
    planningLens: "generic-custom-system",
    confidence: "low",
    primaryObject: null,
    desiredChange: null,
    likelyOutput: null,
    userActor: "user",
    firstPossibleAction: null,
    systemResponseHypothesis: null,
    systemGrammar: {
      actor: "user",
      primaryObject: null,
      input: null,
      transformation: null,
      output: null,
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
    quietAI: "I need one more detail so the planning questions fit your idea."
  };
}

function goalChoice(id: string, label: string, detail: string): PlanningChoice {
  return { id, label, detail, visibleBehavior: detail };
}

function hasSpecificSignal(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function contractQuestion(field: GoalContractField, understanding: GoalUnderstanding): GoalClarificationQuestion {
  const lens = understanding.planningLens;
  if (field === "primaryObject") {
    return {
      id: "goal-primary-object",
      prompt: "What is the main thing your project works with?",
      choices: [
        goalChoice("object-character", "A character or game object", "The project is about a visible character, player, or object."),
        goalChoice("object-picture", "A picture, drawing, or design", "The project changes or shows an image."),
        goalChoice("object-list", "Tasks, items, or a list", "The project helps people track things.")
      ],
      allowFreeText: true,
      allowNotSure: true,
      targets: ["primaryObject"]
    };
  }

  if (field === "coreMechanic") {
    const gameChoices = lens === "game-interaction"
      ? [
        goalChoice("mechanic-jump", "The player jumps or avoids something", "The player repeats an action to avoid a challenge."),
        goalChoice("mechanic-choose", "The player makes choices", "Choices change what happens in the game."),
        goalChoice("mechanic-score", "The player earns points", "The main loop changes the score.")
      ]
      : [
        goalChoice("mechanic-change", "The user changes one thing", "A visible part changes after the user's action."),
        goalChoice("mechanic-choose-result", "The user chooses and sees a result", "A choice leads to a visible result."),
        goalChoice("mechanic-react", "The system reacts", "The project responds after the user acts.")
      ];
    return {
      id: "goal-core-mechanic",
      prompt: lens === "game-interaction" ? "What should the player do again and again?" : "What is the main action that makes your project work?",
      choices: gameChoices,
      allowFreeText: true,
      allowNotSure: true,
      targets: ["coreMechanic"]
    };
  }

  return {
    id: "goal-end-state",
    prompt: "How will someone know the project reached its goal?",
    choices: [
      goalChoice("end-clear-result", "A clear result appears", "The user sees the result they were trying to make."),
      goalChoice("end-score-or-win", "A score, win, or finish state appears", "The project shows progress or completion."),
      goalChoice("end-save-share", "The user can save or share it", "The final result can be kept or shown to someone.")
    ],
    allowFreeText: true,
    allowNotSure: true,
    targets: ["endState"]
  };
}

function inferGoalContract(idea: string, understanding: GoalUnderstanding, turns: GoalClarificationTurn[] = []): GoalContract {
  const combined = [idea, ...turns.map((turn) => turn.answer)].join(" ").replace(/\s+/g, " ").trim();
  const lower = combined.toLowerCase();
  const vague = /^(i want to make\s+)?(a\s+)?(game|app|website|something|something fun|thing)\.?$/i.test(combined.trim());

  const primaryObject = vague && understanding.planningLens === "generic-custom-system"
    ? null
    : understanding.primaryObject;
  const actor = vague && understanding.planningLens === "generic-custom-system"
    ? null
    : understanding.userActor;

  let coreMechanic: string | null = null;
  if (understanding.planningLens === "creative-transform-tool") coreMechanic = "apply a visual style to a drawing";
  if (hasSpecificSignal(lower, [/feed|feeding|happiness|happy|care|react/, /jump|avoid|score|collect|choose|unlock|move/, /style|filter|transform|change|upload|draw/, /hint|explain|check|revise/])) {
    coreMechanic = understanding.desiredChange ?? "user action changes the project";
  }
  const mechanicTurn = turns.find((turn) => turn.targets.includes("coreMechanic"));
  if (mechanicTurn) coreMechanic = mechanicTurn.answer;

  let endState: string | null = null;
  if (understanding.planningLens === "creative-transform-tool") endState = "styled drawing preview";
  if (hasSpecificSignal(lower, [/goal is|win|finish|complete|end|keep|save|share|preview|result|for \d+|score|points|happy for/])) {
    endState = understanding.likelyOutput ?? "a visible result";
  }
  const endTurn = turns.find((turn) => turn.targets.includes("endState"));
  if (endTurn) endState = endTurn.answer;

  const primaryTurn = turns.find((turn) => turn.targets.includes("primaryObject"));
  const actorTurn = turns.find((turn) => turn.targets.includes("actor"));

  return {
    learnerGoal: combined,
    primaryObject: primaryTurn?.answer ?? primaryObject,
    actor: actorTurn?.answer ?? actor,
    coreMechanic,
    endState
  };
}

function goalReadiness(contract: GoalContract, understanding: GoalUnderstanding): GoalReadiness {
  const missingFields: GoalContractField[] = [];
  if (!contract.learnerGoal.trim()) missingFields.push("learnerGoal");
  if (!contract.primaryObject) missingFields.push("primaryObject");
  if (!contract.actor) missingFields.push("actor");
  if (!contract.coreMechanic) missingFields.push("coreMechanic");
  if (!contract.endState) missingFields.push("endState");
  const readyForConfirmation = missingFields.length === 0;
  const confidence: GoalReadiness["confidence"] = readyForConfirmation ? "high" : missingFields.length <= 2 ? "medium" : "low";
  const nextTarget = missingFields.includes("primaryObject")
    ? "primaryObject"
    : missingFields.includes("coreMechanic")
      ? "coreMechanic"
      : missingFields.includes("endState")
        ? "endState"
        : missingFields[0];

  return {
    readyForConfirmation,
    missingFields,
    confidence,
    rationale: readyForConfirmation
      ? "The goal has a main object, actor, core mechanic, and end state."
      : "The goal needs one more concrete part before planning the system trail.",
    nextQuestion: nextTarget ? contractQuestion(nextTarget, understanding) : null
  };
}

export function buildGoalClarification(idea: string, turns: GoalClarificationTurn[] = []): GoalUnderstanding {
  const combinedIdea = [idea, ...turns.map((turn) => turn.answer)].join(" ").trim();
  const understanding = inferGoalUnderstanding(combinedIdea || idea);
  const contract = inferGoalContract(idea, understanding, turns);
  const readiness = goalReadiness(contract, understanding);
  return {
    ...understanding,
    confidence: readiness.confidence,
    goalContract: contract,
    goalReadiness: readiness,
    quietAI: readiness.nextQuestion?.prompt ?? "This goal is clear enough to confirm before planning."
  };
}

const planningQuestionOrder: PlanningQuestion["id"][] = [
  "finished-artifact",
  "first-user-action",
  "first-system-response",
  "system-parts"
];

function planningKind(idea: string): "creative" | "jumping" | "homework" | "pet" | "club" | "story" | "habitat" | "quiz" | "generic" {
  const text = idea.toLowerCase();
  if (/drawing|image|style|filter|art|edit|sketch|paint|photo|picture|draw|画|绘画|图片|图像|风格|滤镜|草图|上色|修图/i.test(idea)) return "creative";
  if (/jump|arcade|platform|obstacle|runner/.test(text)) return "jumping";
  if (/homework|helper|agent|study|tutor|assignment/.test(text)) return "homework";
  if (/pet|animal|puppy|cat|dog|adventure/.test(text)) return "pet";
  if (/club|task|todo|to-do|team|chores/.test(text)) return "club";
  if (/story|world|website|character|comic|page/.test(text)) return "story";
  if (/habitat|simulation|ecosystem|plant|water|climate/.test(text)) return "habitat";
  if (/quiz|trivia|question|school|answer|score/.test(text)) return "quiz";
  return "generic";
}

function planningChoice(id: string, label: string, detail?: string): PlanningChoice {
  return { id, label, detail, visibleBehavior: detail };
}

export function generatePlanningChoices(
  idea: string,
  questionId: PlanningQuestion["id"],
  goalUnderstanding?: GoalUnderstanding
): PlanningChoice[] {
  const kind = goalUnderstanding?.planningLens === "creative-transform-tool" ? "creative" : planningKind(idea);

  if (questionId === "finished-artifact") {
    if (kind === "creative") {
      return [
        planningChoice("upload-drawing", "Upload a drawing", "The user adds a drawing from their device."),
        planningChoice("draw-inside-app", "Draw inside the app", "The user makes a drawing in the tool."),
        planningChoice("pick-sample", "Pick a sample drawing", "The user chooses a drawing already in the app."),
        planningChoice("paste-image", "Paste an image", "The user pastes an image to style.")
      ];
    }
    if (kind === "jumping") {
      return [
        planningChoice("jump-control", "Control a character that jumps"),
        planningChoice("avoid-obstacles", "Avoid obstacles"),
        planningChoice("earn-points", "Earn points")
      ];
    }
    if (kind === "homework") {
      return [
        planningChoice("ask-help", "Ask for help with a problem"),
        planningChoice("get-hints", "Get hints instead of answers"),
        planningChoice("check-attempt", "Check my own attempt")
      ];
    }
    if (kind === "pet") {
      return [
        planningChoice("see-pet", "See a pet on screen"),
        planningChoice("choose-care", "Choose how to care for it"),
        planningChoice("pet-reacts", "Watch the pet react")
      ];
    }
    if (kind === "club") {
      return [
        planningChoice("see-tasks", "See our club tasks"),
        planningChoice("add-task", "Add a task"),
        planningChoice("mark-done", "Mark a task done")
      ];
    }
    if (kind === "story") {
      return [
        planningChoice("explore-world", "Explore a story world"),
        planningChoice("choose-place", "Choose a place"),
        planningChoice("meet-character", "Meet a character")
      ];
    }
    if (kind === "habitat") {
      return [
        planningChoice("see-habitat", "See a habitat"),
        planningChoice("change-part", "Change one habitat part"),
        planningChoice("watch-reaction", "Watch what reacts")
      ];
    }
    if (kind === "quiz") {
      return [
        planningChoice("start-quiz", "Start a quiz"),
        planningChoice("answer-question", "Answer a question"),
        planningChoice("see-score", "See a score")
      ];
    }
    return [
      planningChoice("main-object", "Work with a main object", "The user starts with the main thing this project changes."),
      planningChoice("change-something", "Change something", "The user changes one visible part."),
      planningChoice("see-result", "See a result", "The user sees what happened after the change.")
    ];
  }

  if (questionId === "first-user-action") {
    if (kind === "creative") {
      return [
        planningChoice("cartoon-style", "Add a cartoon style", "The tool makes the drawing look more cartoon-like."),
        planningChoice("watercolor-style", "Add a watercolor style", "The tool makes the drawing look painted."),
        planningChoice("pixel-art-style", "Make it pixel art", "The tool turns the drawing into a pixel-art look."),
        planningChoice("choose-style", "Let the user choose a style", "The user picks which style to apply.")
      ];
    }
    if (kind === "jumping") {
      return [
        planningChoice("press-start", "Press Start"),
        planningChoice("tap-jump", "Tap to jump"),
        planningChoice("choose-character", "Choose a character")
      ];
    }
    if (kind === "homework") {
      return [
        planningChoice("type-help", "Type what I need help with"),
        planningChoice("choose-subject", "Choose a subject"),
        planningChoice("share-attempt", "Share what I already tried")
      ];
    }
    return [
      planningChoice("add-object", "Add the main thing", "The user adds the thing they want to work with."),
      planningChoice("choose-change", "Choose a change", "The user chooses what should happen to it."),
      planningChoice("describe-goal", "Describe the result", "The user says what they want to see.")
    ];
  }

  if (questionId === "first-system-response") {
    if (kind === "creative") {
      return [
        planningChoice("styled-preview", "Show the styled image", "The user sees the drawing with the selected style."),
        planningChoice("before-after", "Show before and after", "The user compares the original and styled drawing."),
        planningChoice("try-another", "Let the user try another style", "The user can explore a different style result."),
        planningChoice("adjust-strength", "Let the user adjust strength", "The user changes how strong the style looks.")
      ];
    }
    if (kind === "jumping") {
      return [
        planningChoice("character-jumps", "The character jumps"),
        planningChoice("obstacles-move", "Obstacles start moving"),
        planningChoice("score-appears", "The score appears")
      ];
    }
    if (kind === "homework") {
      return [
        planningChoice("ask-tried", "Ask what I already tried"),
        planningChoice("give-hint", "Give a hint"),
        planningChoice("explain-step", "Explain one step")
      ];
    }
    return [
      planningChoice("show-output", "Show the result", "The user sees the output of the change."),
      planningChoice("show-feedback", "Show feedback", "The system shows what happened."),
      planningChoice("save-or-continue", "Save or continue", "The user can keep the result or try the next step.")
    ];
  }

  return [];
}

export function getPlanningQuestion(session: PlanningSession): PlanningQuestion | undefined {
  const answeredIds = new Set(session.responses.map((response) => response.questionId));
  const nextId = planningQuestionOrder.find((questionId) => !answeredIds.has(questionId));
  if (!nextId) return undefined;
  const understanding = session.goalUnderstanding ?? inferGoalUnderstanding(session.idea);
  const boundaryNote = understanding.planningLens === "learning-helper-agent"
    ? "This project should help you learn, not do the homework for you."
    : undefined;

  const prompts: Record<PlanningQuestion["id"], Pick<PlanningQuestion, "title" | "prompt" | "quietAiNote">> = {
    "finished-artifact": {
      title: "Finished project",
      prompt: "When your project is working, what should someone be able to do?",
      quietAiNote: "Start with what a person can see or do, not with code."
    },
    "first-user-action": {
      title: "First user action",
      prompt: "What should the user do first?",
      quietAiNote: "This gives your system a clear entrance."
    },
    "first-system-response": {
      title: "First system response",
      prompt: "What should the system show or do after that?",
      quietAiNote: "A response connects the user's action to a visible result."
    },
    "system-parts": {
      title: "System parts",
      prompt: "Which parts should be in your system trail?",
      quietAiNote: "You choose what belongs. This is still a draft."
    }
  };

  if (understanding.planningLens === "creative-transform-tool") {
    prompts["finished-artifact"] = {
      title: "Input source",
      prompt: "How should the drawing or image get into the tool?",
      quietAiNote: "The first action tells us how the drawing enters your tool."
    };
    prompts["first-user-action"] = {
      title: "Style change",
      prompt: "What change should the tool make?",
      quietAiNote: "Now we name the transformation your tool will do."
    };
    prompts["first-system-response"] = {
      title: "Result preview",
      prompt: "How should the user see the result?",
      quietAiNote: "A preview lets the user check if the style change worked."
    };
  } else if (understanding.planningLens === "task-organizer") {
    prompts["finished-artifact"] = {
      title: "Tracked item",
      prompt: "What should the user keep track of?",
      quietAiNote: "The main item tells us what this organizer changes."
    };
    prompts["first-user-action"] = {
      title: "First list action",
      prompt: "What should the user do first?",
      quietAiNote: "The first action starts the list system."
    };
    prompts["first-system-response"] = {
      title: "List response",
      prompt: "What should change after the user acts?",
      quietAiNote: "The system response should be something visible in the list."
    };
  } else if (understanding.planningLens === "learning-helper-agent") {
    prompts["finished-artifact"] = {
      title: "Learning support",
      prompt: "What kind of help should the agent give?",
      quietAiNote: "This keeps the helper focused on learning, not doing the work."
    };
    prompts["first-user-action"] = {
      title: "Learner input",
      prompt: "What should the learner share first?",
      quietAiNote: "The helper needs the learner's thinking before giving support."
    };
    prompts["first-system-response"] = {
      title: "Learning boundary",
      prompt: "What should the helper avoid doing?",
      quietAiNote: "A boundary keeps the learner in charge."
    };
  } else if (understanding.confidence === "low") {
    prompts["finished-artifact"] = {
      title: "Main thing",
      prompt: "What is the main thing someone will work with?",
      quietAiNote: "Once we know the main thing, we can plan how it changes."
    };
  }

  return {
    id: nextId,
    ...prompts[nextId],
    quietAiNote: boundaryNote ? `${prompts[nextId].quietAiNote} ${boundaryNote}` : prompts[nextId].quietAiNote,
    choices: generatePlanningChoices(session.idea, nextId, understanding),
    allowFreeText: true,
    allowNotSure: true,
    allowMultiple: true,
    boundaryNote
  };
}

export function createPlanningSession(projectId: string, idea: string): PlanningSession {
  const goalUnderstanding = buildGoalClarification(idea);
  return {
    id: `planning-${slugId(projectId)}-${Date.now()}`,
    projectId,
    idea: idea.trim(),
    status: goalUnderstanding.goalReadiness?.readyForConfirmation ? "goal_understanding_generated" : "goal_understanding_needs_clarification",
    responses: [],
    candidateParts: [],
    goalClarificationTurns: [],
    goalUnderstanding,
    createdAt: ISO_STUB,
    updatedAt: ISO_STUB
  };
}

export function startCoPlanning(idea: string): PlanningStartResponse {
  const project = createProjectFromIdea(idea);
  const planningSession = createPlanningSession(project.id, project.originalIdea);

  return {
    engineSource: "fallback",
    project,
    planningSession,
    goalUnderstanding: planningSession.goalUnderstanding ?? inferGoalUnderstanding(project.originalIdea),
    currentQuestion: null,
    starterCode: STARTER_CODE,
    assistantMessage: "Check my understanding first. Then we will plan the system together."
  };
}

export function confirmGoalUnderstanding(input: {
  project: Project;
  session: PlanningSession;
  action?: "confirm" | "revise" | "answer-goal-question";
  extraDetail?: string;
  answer?: string;
  question?: GoalClarificationQuestion | null;
  source?: PlanningResponseSource;
}): PlanningUnderstandingResponse {
  const action = input.action ?? (input.extraDetail ? "revise" : "confirm");
  const turns = [...(input.session.goalClarificationTurns ?? [])];
  if (action === "answer-goal-question") {
    const question = input.question ?? input.session.goalUnderstanding?.goalReadiness?.nextQuestion;
    const answer = input.answer?.trim() ?? input.extraDetail?.trim() ?? "";
    if (!question || !answer) throw new Error("goal question and answer are required");
    turns.push({
      id: `goal-turn-${turns.length + 1}`,
      questionId: question.id,
      prompt: question.prompt,
      answer,
      source: input.source ?? "choice",
      targets: question.targets,
      createdAt: ISO_STUB
    });
  }
  const idea = action === "revise" && input.extraDetail ? [input.session.idea, input.extraDetail].join(" ") : input.session.idea;
  const goalUnderstanding = action === "revise"
    ? buildGoalClarification(idea)
    : buildGoalClarification(idea, turns);
  if (action === "confirm" && !goalUnderstanding.goalReadiness?.readyForConfirmation) {
    throw new Error("Answer the goal question before confirming this goal.");
  }
  const project: Project = {
    ...input.project,
    title: goalUnderstanding.projectTitle,
    shortDescription: goalUnderstanding.learnerFacingRestatement,
    updatedAt: ISO_STUB
  };
  const planningSession: PlanningSession = {
    ...input.session,
    idea,
    goalUnderstanding,
    goalClarificationTurns: turns,
    status: action === "confirm"
      ? "goal_understanding_confirmed"
      : goalUnderstanding.goalReadiness?.readyForConfirmation
        ? "goal_understanding_generated"
        : "goal_understanding_needs_clarification",
    updatedAt: ISO_STUB
  };
  const currentQuestion = action === "confirm" ? getPlanningQuestion(planningSession) : null;
  if (action === "confirm" && !currentQuestion) throw new Error("Planning question could not be created");

  return {
    engineSource: "fallback",
    project,
    planningSession,
    goalUnderstanding,
    currentQuestion,
    assistantMessage: action === "confirm"
      ? "Great. Now we will ask one planning question at a time."
      : goalUnderstanding.goalReadiness?.nextQuestion?.prompt ?? "This goal is ready for you to confirm."
  };
}

function statusAfterPlanningQuestion(questionId: PlanningQuestion["id"]) {
  if (questionId === "finished-artifact") return "outcome_clarified" as const;
  if (questionId === "first-user-action") return "first_action_clarified" as const;
  if (questionId === "first-system-response") return "system_response_clarified" as const;
  return "parts_selected" as const;
}

export function draftPreviewNodesForSession(session: PlanningSession): string[] {
  const responseByQuestion = new Map(session.responses.map((response) => [response.questionId, response.answer]));
  const preview = [
    responseByQuestion.get("first-user-action"),
    responseByQuestion.get("first-system-response"),
    ...session.candidateParts.filter((part) => part.selected).slice(0, 4).map((part) => part.title)
  ].filter(Boolean) as string[];

  if (!preview.length && responseByQuestion.get("finished-artifact")) {
    return [responseByQuestion.get("finished-artifact") as string];
  }

  return Array.from(new Set(preview)).slice(0, 6);
}

export function answerPlanningQuestion(input: {
  session: PlanningSession;
  questionId: PlanningQuestion["id"];
  answer: string;
  source: PlanningResponseSource;
}): PlanningAnswerResponse {
  if (
    input.session.status === "started" ||
    input.session.status === "goal_understanding_generated" ||
    input.session.status === "goal_understanding_needs_clarification"
  ) {
    throw new Error("Confirm the goal understanding before answering co-planning questions.");
  }
  const answer = input.answer.trim() || "I'm not sure yet";
  const response: PlanningResponse = {
    id: `planning-response-${input.session.responses.length + 1}`,
    questionId: input.questionId,
    answer,
    source: input.source,
    createdAt: ISO_STUB
  };
  const responses = [
    ...input.session.responses.filter((item) => item.questionId !== input.questionId),
    response
  ].sort((a, b) => planningQuestionOrder.indexOf(a.questionId) - planningQuestionOrder.indexOf(b.questionId));
  let planningSession: PlanningSession = {
    ...input.session,
    status: statusAfterPlanningQuestion(input.questionId),
    responses,
    updatedAt: ISO_STUB
  };

  if (input.questionId === "first-system-response") {
    planningSession = {
      ...planningSession,
      candidateParts: generateCandidateSystemParts(planningSession)
    };
  }

  const currentQuestion = getPlanningQuestion(planningSession);
  return {
    engineSource: "fallback",
    planningSession,
    currentQuestion,
    draftPreviewNodes: draftPreviewNodesForSession(planningSession),
    assistantMessage: currentQuestion
      ? "Good. The draft trail is growing, but it is not final yet."
      : "Choose what belongs in your trail. You can edit before confirming."
  };
}

function responseText(session: PlanningSession, questionId: PlanningQuestion["id"]) {
  return session.responses.find((response) => response.questionId === questionId)?.answer;
}

export function generateCandidateSystemParts(session: PlanningSession): CandidateSystemPart[] {
  const combinedIdea = [
    session.idea,
    responseText(session, "finished-artifact"),
    responseText(session, "first-user-action"),
    responseText(session, "first-system-response")
  ].filter(Boolean).join(" ");
  const baseTrail = generateSystemTrailFromIdea(combinedIdea || session.idea);

  return baseTrail.nodes.slice(0, 7).map((node) => ({
    id: `candidate-${node.id}`,
    title: node.title,
    visibleBehavior: node.visibleBehavior,
    systemRole: node.systemRole,
    selected: true,
    source: "ai-suggested"
  }));
}

function draftSourceForCandidate(source: CandidateSystemPart["source"]): DraftSystemNode["source"] {
  if (source === "student-created") return "student-chosen";
  if (source === "student-edited") return "student-edited";
  return "ai-suggested";
}

export function createDraftTrailFromCandidates(session: PlanningSession): DraftTrailResponse {
  const candidates = session.candidateParts.length ? session.candidateParts : generateCandidateSystemParts(session);
  const selected = candidates.filter((part) => part.selected).slice(0, 6);
  const nodes: DraftSystemNode[] = selected.map((part, index) => ({
    id: `draft-node-${index + 1}`,
    title: part.title,
    visibleBehavior: part.visibleBehavior,
    systemRole: part.systemRole,
    order: index + 1,
    status: "draft",
    source: draftSourceForCandidate(part.source)
  }));
  const draftTrail: DraftSystemTrail = {
    nodes,
    edges: nodes.slice(0, -1).map((node, index) => ({
      from: node.id,
      to: nodes[index + 1].id,
      type: index >= 2 ? "feedback-loop" : "sequence"
    }))
  };
  const planningSession: PlanningSession = {
    ...session,
    candidateParts: candidates,
    draftTrail,
    status: "draft_trail_created",
    updatedAt: ISO_STUB
  };

  return {
    engineSource: "fallback",
    planningSession,
    draftTrail,
    assistantMessage: "Review your draft system trail. It is not final yet."
  };
}

export function reviewDraftTrail(session: PlanningSession, draftTrail: DraftSystemTrail): DraftTrailResponse {
  const planningSession: PlanningSession = {
    ...session,
    draftTrail,
    status: "draft_trail_reviewed",
    updatedAt: ISO_STUB
  };
  return {
    engineSource: "fallback",
    planningSession,
    draftTrail,
    assistantMessage: "Now choose the first small part to build."
  };
}

function milestoneForDraftNode(node: DraftSystemNode) {
  return {
    id: `${node.id}-m1`,
    title: node.title,
    before: `This system part is not working yet: ${node.title}.`,
    after: node.visibleBehavior,
    rationale: `${node.title} helps the learner see how this project works as a system.`
  };
}

export function confirmDraftTrail(input: {
  project: Project;
  session: PlanningSession;
  draftTrail: DraftSystemTrail;
  selectedFirstNodeId: string;
}): ConfirmedTrailResponse {
  if (input.session.status !== "draft_trail_reviewed") {
    throw new Error("Review the draft trail before confirming it.");
  }
  const activeDraftNodes = input.draftTrail.nodes.filter((node) => node.status !== "removed");
  const selectedFirstNodeId = input.selectedFirstNodeId || activeDraftNodes[0]?.id;
  if (!selectedFirstNodeId) throw new Error("Choose a first build step.");

  const nodes: SystemNode[] = activeDraftNodes.map((node, index) => ({
    id: `node-${index + 1}`,
    title: node.title,
    visibleBehavior: node.visibleBehavior,
    systemRole: node.systemRole,
    order: index + 1,
    status: node.id === selectedFirstNodeId ? "current" : "planned",
    dependencies: index > 0 ? [`node-${index}`] : undefined,
    suggestedMilestones: [milestoneForDraftNode(node)]
  }));
  const edges: SystemEdge[] = nodes.slice(0, -1).map((node, index) => ({
    from: node.id,
    to: nodes[index + 1].id,
    type: index >= 2 ? "feedback-loop" : "sequence"
  }));
  const selectedSystemNode = nodes[activeDraftNodes.findIndex((node) => node.id === selectedFirstNodeId)] ?? nodes[0];
  const project: Project = {
    ...input.project,
    currentFocusNodeId: selectedSystemNode?.id,
    status: "trail_confirmed",
    updatedAt: ISO_STUB,
    systemTrail: { nodes, edges }
  };
  const planningSession: PlanningSession = {
    ...input.session,
    status: "completed",
    updatedAt: ISO_STUB
  };

  return {
    engineSource: "fallback",
    project,
    planningSession,
    assistantMessage: "Your System Trail is confirmed. Now build one bounded part."
  };
}

export function createGoalInterview(idea: string): GoalInterviewResponse {
  const projectPreview = createProjectFromIdea(idea);
  return {
    engineSource: "fallback",
    reflectedGoal: `You want to make: ${projectPreview.originalIdea}`,
    progressLabel: "Ready to co-plan",
    nextQuestion: {
      id: "first-visible-part",
      prompt: "What should someone see first?",
      options: ["First screen", "A choice", "A reaction"],
      allowFreeText: true
    },
    turns: [],
    projectPreview,
    readiness: {
      answeredCount: 0,
      requiredCount: 4,
      canGeneratePath: false,
      missing: ["finished project", "first action", "system response", "system parts"]
    },
    assistantMessage: "We should co-plan the trail together before it becomes a canvas. No code yet."
  };
}

export function answerGoalInterview(input: {
  idea: string;
  turns: GoalInterviewTurn[];
  questionId: string;
  answer: string;
}): GoalInterviewResponse {
  const projectPreview = createProjectFromIdea(`${input.idea} ${input.answer}`);
  const turns = [
    ...input.turns,
    {
      questionId: input.questionId,
      prompt: "What should someone see first?",
      answer: input.answer,
      createdAt: ISO_STUB
    }
  ];
  return {
    engineSource: "fallback",
    reflectedGoal: `I added this idea to the trail: ${input.answer}`,
    progressLabel: "Co-planning in progress",
    turns,
    projectPreview,
    readiness: {
      answeredCount: 1,
      requiredCount: 4,
      canGeneratePath: false,
      missing: ["first action", "system response", "system parts"]
    },
    assistantMessage: "The draft trail can start growing, but the learner still reviews it."
  };
}

export function createClarification(idea: string): ClarificationResponse {
  const project = createProjectFromIdea(idea);
  const firstNode = project.systemTrail.nodes[0];
  return {
    reflectedIdea: `I understand this as: ${project.originalIdea}`,
    suggestedTitle: project.title,
    questions: [
      {
        id: "first-visible-part",
        prompt: "What should someone see first?",
        options: [firstNode?.title ?? "First view", "A choice", "A reaction"],
        allowFreeText: true
      }
    ],
    interview: createGoalInterview(idea)
  };
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

export function createProjectPathMap(idea: string): ProjectPathMap {
  const project = createProjectFromIdea(idea);
  return {
    title: project.title,
    summary: "Legacy map view. The main app now uses System Trail Canvas.",
    confidence: 1,
    nodes: project.systemTrail.nodes.map((node, index) =>
      draftNode(node.id, index === 0 ? "goal" : "mechanic", node.title, node.visibleBehavior, "system trail", node.status === "planned" ? "draft" : "known")
    ),
    edges: project.systemTrail.edges.map((edge) => ({ from: edge.from, to: edge.to, label: edge.type ?? "sequence" })),
    openQuestions: [],
    updatedAt: ISO_STUB
  };
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
    .slice(0, 5);
}

function readableChecklistItem(item: string): string {
  return item.replace(/\.$/u, "").replace(/\s+/gu, " ").trim();
}

function isVagueChecklistItem(item: string): boolean {
  const text = item.toLowerCase().trim();
  if (text.length < 8) return true;
  if (/^(it works|works|looks good|it looks good|the game is fun|fun|done|finished|good)$/iu.test(text)) return true;
  return !/(i can|when|click|tap|type|choose|see|show|appear|change|tell|message|score|button|answer|screen|pet|task|story|habitat|list|react|move|done)/iu.test(text);
}

function defaultChecksForNode(node: SystemNode): string[] {
  const text = `${node.title} ${node.visibleBehavior} ${node.systemRole}`.toLowerCase();
  if (/pet/.test(text)) {
    return ["I can see the pet.", "When I choose something, the pet reacts.", "I see what changed for the pet."];
  }
  if (/task|list|done/.test(text)) {
    return ["I can see the task list.", "I can change one task.", "I see the list update right away."];
  }
  if (/story|world|character|place/.test(text)) {
    return ["I can see the story world.", "I can choose one place or path.", "I see what happens next."];
  }
  if (/habitat|plant|animal|need|balance/.test(text)) {
    return ["I can see the habitat.", "I can change one habitat part.", "I see how the habitat responds."];
  }
  if (/answer|feedback|correct|try again/.test(text)) {
    return ["I can click an answer.", "The project shows what happened.", "I see a message right away."];
  }
  if (/score|point/.test(text)) {
    return ["I can see the score.", "The score changes after the right action.", "The score stays visible."];
  }
  if (/question|choice/.test(text)) {
    return ["I can see one question.", "I can see answer choices.", "I can choose one answer."];
  }
  return [`I can see ${node.title.toLowerCase()}.`, "I can try one action.", "I see what changes after my action."];
}

function overlapScore(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/[^a-z0-9]+/u).filter((word) => word.length > 3));
  return b
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((word) => aWords.has(word)).length;
}

function checkableVersion(item: string): string {
  const cleaned = readableChecklistItem(item);
  if (/^(i can|when|the|a|an)\b/iu.test(cleaned)) return cleaned;
  if (/click|tap|choose|type/iu.test(cleaned)) return `I can ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
  if (/show|appear|visible|see|react|change/iu.test(cleaned)) return `I see ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
  return cleaned;
}

export function reviewChecklist(input: { node: SystemNode; draftChecklist: string }): ChecklistFeedbackResponse {
  const draftItems = parseChecklistDraft(input.draftChecklist);
  const defaults = defaultChecksForNode(input.node);
  const goodAndCheckable = draftItems
    .filter((item) => !isVagueChecklistItem(item))
    .map((text) => ({
      text,
      reason: "A friend can try this in the preview and answer yes, not yet, or not sure."
    }));
  const tooVague = draftItems
    .filter(isVagueChecklistItem)
    .map((text) => ({
      text,
      reason: "This is a good idea, but it does not say what should happen on the screen."
    }));
  const covered = new Set<string>();
  for (const item of goodAndCheckable) {
    const best = defaults.find((candidate) => overlapScore(item.text, candidate) > 0);
    if (best) covered.add(best);
  }
  const missing = defaults
    .filter((item) => !covered.has(item))
    .slice(0, Math.max(1, 4 - goodAndCheckable.length))
    .map((text) => ({
      text,
      reason: "This check helps connect the step to the rest of the system."
    }));
  const improvedChecklist = [
    ...goodAndCheckable.map((item) => checkableVersion(item.text)),
    ...missing.map((item) => checkableVersion(item.text))
  ].slice(0, 4);
  const firstMissing = missing[0]?.text;

  return {
    engineSource: "fallback",
    goodAndCheckable,
    tooVague,
    missingStep: missing,
    improvedChecklist: improvedChecklist.length ? improvedChecklist : defaults.slice(0, 3),
    assistantMessage: firstMissing
      ? `Nice start. One check is missing: ${firstMissing.toLowerCase()}`
      : "Nice start. These checks are ready to test."
  };
}

function firstMilestone(node: SystemNode) {
  return node.suggestedMilestones?.[0] ?? {
    id: `${node.id}-m1`,
    title: node.title,
    before: `This part is not visible yet: ${node.title}.`,
    after: node.visibleBehavior,
    rationale: "This step makes one visible system part work."
  };
}

export function storyForNode(node: SystemNode) {
  const suggestion = firstMilestone(node);
  return {
    before: suggestion.before,
    after: suggestion.after
  };
}

export function logicChainForNode(node: SystemNode): LogicChainStep[] {
  const text = `${node.title} ${node.visibleBehavior} ${node.systemRole}`.toLowerCase();
  if (/pet/.test(text)) {
    return [
      { id: "action", title: "Choose for pet", detail: "The player chooses food, play, or care.", role: "user-action" },
      { id: "change", title: "Pet checks choice", detail: "The system sees what the player chose.", role: "system-change" },
      { id: "output", title: "Pet reacts", detail: "The pet shows a visible response.", role: "system-output" },
      { id: "understand", title: "Player knows pet feeling", detail: "The player can tell what changed.", role: "user-understanding" }
    ];
  }
  if (/task|list|done/.test(text)) {
    return [
      { id: "action", title: "Click a task", detail: "The user chooses one task.", role: "user-action" },
      { id: "change", title: "Task status changes", detail: "The system marks it active or done.", role: "system-change" },
      { id: "output", title: "List updates", detail: "The changed task looks different.", role: "system-output" },
      { id: "understand", title: "Club sees progress", detail: "Everyone can see what is finished.", role: "user-understanding" }
    ];
  }
  if (/story|world|character|place/.test(text)) {
    return [
      { id: "action", title: "Choose a path", detail: "The reader picks a place or story choice.", role: "user-action" },
      { id: "change", title: "World changes path", detail: "The system follows that choice.", role: "system-change" },
      { id: "output", title: "New story appears", detail: "The reader sees the next moment.", role: "system-output" },
      { id: "understand", title: "Reader knows the path", detail: "The story feels connected.", role: "user-understanding" }
    ];
  }
  if (/habitat|plant|animal|need|balance/.test(text)) {
    return [
      { id: "action", title: "Change habitat part", detail: "The learner changes water, food, light, or a living thing.", role: "user-action" },
      { id: "change", title: "Need changes", detail: "The system updates one habitat need.", role: "system-change" },
      { id: "output", title: "Habitat responds", detail: "The living thing or balance message changes.", role: "system-output" },
      { id: "understand", title: "Learner sees a relationship", detail: "The change shows how parts connect.", role: "user-understanding" }
    ];
  }
  if (/answer|question|quiz|score|feedback|correct/.test(text)) {
    return [
      { id: "action", title: "Click answer", detail: "The player chooses one answer.", role: "user-action" },
      { id: "change", title: "Check if right", detail: "The system checks the choice.", role: "system-change" },
      { id: "output", title: "Show message", detail: "The project shows a visible result.", role: "system-output" },
      { id: "understand", title: "Player knows what happened", detail: "The player can tell if it worked.", role: "user-understanding" }
    ];
  }
  return [
    { id: "action", title: "Try one action", detail: "The user does one clear thing.", role: "user-action" },
    { id: "change", title: "System changes", detail: "The project updates one part.", role: "system-change" },
    { id: "output", title: "Result appears", detail: "Something visible changes.", role: "system-output" },
    { id: "understand", title: "User understands", detail: "The user knows what happened.", role: "user-understanding" }
  ];
}

function predictionForNode(node: SystemNode): PredictionQuestion {
  return {
    prompt: "What should you look for in the preview?",
    options: [node.visibleBehavior, "The whole project is finished", "Only the colors changed"],
    correctIndex: 0
  };
}

export function planMilestone(input: { node: SystemNode; checklist?: string[] } | SystemNode): MilestonePlanResponse {
  const node = "node" in input ? input.node : input;
  return {
    node: {
      ...node,
      status: "building"
    },
    story: storyForNode(node),
    logicChain: logicChainForNode(node),
    predictionQuestion: predictionForNode(node),
    buildPlan: ["Build only this visible part", "Run the preview", "Check your list by hand"]
  };
}

function compactConcepts(node: SystemNode): string[] {
  const text = `${node.title} ${node.systemRole}`.toLowerCase();
  if (/state|score|happiness|remember|progress/.test(text)) return ["remembered value", "screen change"];
  if (/feedback|react|message|respond/.test(text)) return ["feedback", "if rule"];
  if (/input|choice|click|task|answer/.test(text)) return ["user action", "visible result"];
  return ["system part", "visible result"];
}

export function generatePatch(input: { node: SystemNode; checklist?: string[] } | SystemNode): PatchResponse {
  const node = "node" in input ? input.node : input;
  const checklist = ("node" in input ? input.checklist : undefined) ?? defaultChecksForNode(node);
  const code = codeForSystemNode({
    order: node.order,
    title: node.title,
    visibleOutput: node.visibleBehavior,
    doneChecklist: checklist
  });

  return {
    code,
    changeSummary: [`Added: ${node.visibleBehavior}`, `Focused on: ${node.title}`],
    changedFiles: ["sketch.js"],
    checkpointName: node.title,
    miniExplainQuestion: {
      prompt: "What did this step add to your system?",
      options: [node.visibleBehavior, "A whole finished project", "A hidden code file"],
      correctIndex: 0
    },
    learningTraceDelta: {
      conceptsTouched: compactConcepts(node),
      decisionsMade: [`Built system node: ${node.title}`]
    },
    validation: {
      scopedToMilestone: true,
      noFullProjectGeneration: true,
      reason: "This patch targets one selected system node and one sketch.js preview."
    }
  };
}

export function diagnoseDebug(input: {
  visibleBehavior?: string;
  failedChecklistItem?: string;
  node?: SystemNode;
}): DebugDiagnosisResponse {
  const nodeTitle = input.node?.title ?? "this step";
  const failedChecklistItem = input.failedChecklistItem || defaultChecksForNode(input.node ?? generateSystemTrailFromIdea("generic").nodes[0])[0];
  const visibleBehavior = input.visibleBehavior || `I do not see this yet: ${failedChecklistItem}`;
  return {
    visibleBehavior,
    failedChecklistItem,
    choices: [
      {
        label: "The action is not connected",
        explanation: "The project needs to notice the user's click, tap, or choice.",
        isLikely: /click|tap|choose|answer|task|action/i.test(failedChecklistItem)
      },
      {
        label: "The result is not shown",
        explanation: "The project may have the idea, but it still needs to show the result on screen.",
        isLikely: /see|show|appear|message|visible|react/i.test(failedChecklistItem)
      },
      {
        label: "The system forgot the change",
        explanation: "A score, status, mood, or choice may need to be remembered.",
        isLikely: /score|status|happiness|remember|done|change/i.test(failedChecklistItem)
      }
    ],
    likelyCause: `${nodeTitle} is missing the visible part named in your checklist.`,
    fixSummary: "Add the smallest visible result, then run the preview again."
  };
}
