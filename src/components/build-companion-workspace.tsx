"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Code2,
  Database,
  Download,
  Eye,
  Flag,
  Folder,
  Gamepad2,
  GitBranch,
  Headphones,
  Home,
  Layers3,
  Lightbulb,
  ListChecks,
  Map,
  MessageCircle,
  Minus,
  MoreHorizontal,
  MousePointerClick,
  Pencil,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Send,
  Share2,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  Wand2,
  Workflow
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { postJson } from "@/lib/api-client";
import { P5Preview } from "@/components/p5-preview";
import { ProjectPathMapView } from "@/components/project-path-map";
import { STARTER_CODE } from "@/lib/p5-code";
import {
  ChecklistFeedbackResponse,
  Checkpoint,
  DebugDiagnosisResponse,
  GoalInterviewResponse,
  LearningTrace,
  Milestone,
  MilestonePlanResponse,
  PatchResponse,
  PreviewState,
  Project,
  ProjectPathMap,
  ProjectPathResponse
} from "@/lib/types";

type AppStage = "dashboard" | "flowchart" | "milestones" | "preview";
type DrawerTab = "changes" | "code" | "console" | "history";
type ScaffoldStep = "story" | "checklist" | "logic" | "build" | "preview" | "explain";
type ChecklistCheckStatus = "yes" | "not_yet" | "unsure";

const STORAGE_KEY = "student-ai-build-companion-state-v2";
const DEFAULT_IDEA = "I want to make a quiz game about my school.";

const starterCards = [
  {
    title: "Quiz Game",
    description: "Make a quiz game with points, questions, and fun feedback.",
    idea: DEFAULT_IDEA,
    tone: "violet",
    icon: Gamepad2
  },
  {
    title: "Pet Game",
    description: "Create a game about a pet's adventure and challenges.",
    idea: "I want to make a pet adventure game with choices and challenges.",
    tone: "teal",
    icon: Sparkles
  },
  {
    title: "Club Task App",
    description: "Build an app to organize tasks for your club or team.",
    idea: "I want to make a club task app for my school team.",
    tone: "blue",
    icon: ListChecks
  },
  {
    title: "Story World Site",
    description: "Design an interactive story world with pages and characters.",
    idea: "I want to make an interactive story world about my school.",
    tone: "amber",
    icon: BookOpen
  }
];

const helperChoices = [
  { label: "A title screen with a Start button", icon: Play },
  { label: "A question right away", icon: CircleHelp },
  { label: "A menu of quiz topics", icon: ListChecks },
  { label: "Describe it myself", icon: Pencil }
];

const howItWorks = [
  { title: "Share your idea", description: "Type anything that matters to you.", icon: Sparkles },
  { title: "AI helps clarify", description: "Answer a few quick questions or describe it your way.", icon: Bot },
  { title: "We make a map", description: "Get small steps you can build one by one.", icon: Flag },
  { title: "You build and iterate", description: "Preview, test, and improve as you go.", icon: Trophy }
];

const sentenceStarters = ["I can...", "When I click..., the app...", "I see...", "The game tells me...", "The score..."];

const scaffoldSteps: Array<{ id: ScaffoldStep; title: string; hint: string }> = [
  { id: "story", title: "Step story", hint: "What are we making happen?" },
  { id: "checklist", title: "My checklist", hint: "How will we know it works?" },
  { id: "logic", title: "Logic map", hint: "What happens first, next, and after?" },
  { id: "build", title: "Build step", hint: "Make one small change." },
  { id: "preview", title: "Check preview", hint: "Compare what you expected and what you saw." },
  { id: "explain", title: "Mini-explain", hint: "Name the tiny idea you used." }
];

const visualCues = [
  { label: "Goal", detail: "what you want", icon: Target },
  { label: "Action", detail: "what the player does", icon: MousePointerClick },
  { label: "Process", detail: "what the app checks", icon: GitBranch },
  { label: "Output", detail: "what appears", icon: Eye },
  { label: "Feedback", detail: "what the player learns", icon: MessageCircle },
  { label: "State", detail: "what the app remembers", icon: Database }
];

function parseChecklistText(text: string): string[] {
  return text
    .split(/\n|;/u)
    .map((line) =>
      line
        .replace(/^\s*(?:[-*]|\d+[.)]|□|\[ ?\])\s*/u, "")
        .replace(/\s+/gu, " ")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 4);
}

function systemCardsForMilestone(order?: number) {
  if (!order || order <= 1) {
    return [
      { kind: "goal", title: "Player opens quiz", detail: "The game has a clear beginning.", icon: Target },
      { kind: "output", title: "Start screen appears", detail: "Title and Start button are visible.", icon: Eye }
    ];
  }
  if (order === 2) {
    return [
      { kind: "action", title: "Player clicks Start", detail: "The first action begins the quiz.", icon: MousePointerClick },
      { kind: "process", title: "Game changes screen", detail: "The app moves from start to question.", icon: GitBranch },
      { kind: "output", title: "Question appears", detail: "The player can see choices.", icon: Eye }
    ];
  }
  if (order === 3) {
    return [
      { kind: "action", title: "Player clicks answer", detail: "The game receives a choice.", icon: MousePointerClick },
      { kind: "decision", title: "Game checks answer", detail: "Right answer or try again?", icon: GitBranch },
      { kind: "feedback", title: "Message appears", detail: "The player knows what happened.", icon: MessageCircle }
    ];
  }
  if (order === 4) {
    return [
      { kind: "input", title: "Correct answer", detail: "A right choice is counted.", icon: Check },
      { kind: "state", title: "Score changes", detail: "The game remembers the points.", icon: Database },
      { kind: "output", title: "Score is shown", detail: "The player sees progress.", icon: Eye }
    ];
  }
  return [
    { kind: "state", title: "Question list", detail: "The game remembers more questions.", icon: Database },
    { kind: "process", title: "Next question", detail: "The quiz moves forward.", icon: GitBranch },
    { kind: "feedback", title: "Result screen", detail: "The player sees the final score.", icon: MessageCircle }
  ];
}

function beforeAfterForMilestone(milestone?: Milestone) {
  if (!milestone) {
    return {
      before: "No small step is selected yet.",
      after: "Pick one step to see what should change."
    };
  }
  if (milestone.order === 1) {
    return {
      before: "The project does not have a first screen yet.",
      after: "The player sees a title and a Start button."
    };
  }
  if (milestone.order === 2) {
    return {
      before: "Clicking Start does not show a playable question.",
      after: "Clicking Start shows one question with answer choices."
    };
  }
  if (milestone.order === 3) {
    return {
      before: "Clicking an answer does not tell the player anything.",
      after: "Clicking an answer shows Correct or Try again."
    };
  }
  if (milestone.order === 4) {
    return {
      before: "The game does not remember points yet.",
      after: "Correct answers change the score."
    };
  }
  return {
    before: "The quiz only has one short path.",
    after: "The quiz moves through more questions and shows a result."
  };
}

function statusLabel(status: Milestone["status"]): string {
  if (status === "done") return "Done";
  if (status === "in_progress") return "Current";
  if (status === "needs_fix") return "Fix";
  return "Next";
}

function mergeUnique(existing: string[], incoming: string[]): string[] {
  return Array.from(new Set([...existing, ...incoming]));
}

function updateMilestone(milestones: Milestone[], id: string, patch: Partial<Milestone>): Milestone[] {
  return milestones.map((milestone) => (milestone.id === id ? { ...milestone, ...patch } : milestone));
}

function nextMilestoneAfter(milestones: Milestone[], selected?: Milestone): Milestone | undefined {
  if (!selected) return milestones[0];
  return milestones.find((milestone) => milestone.order === selected.order + 1);
}

function grade3Copy(text: string): string {
  return text
    .replace(/\bp5\.js\b/gi, "the preview")
    .replace(/\bbounded milestone\b/gi, "small step")
    .replace(/\bmilestone\b/gi, "step")
    .replace(/\bstate changes?\b/gi, "screen change")
    .replace(/\brender(ed|ing|s)?\b/gi, "show")
    .replace(/\bcondition\b/gi, "rule")
    .replace(/\bUI\s*\+\s*Data\b/gi, "screen + answers");
}

export function BuildCompanionWorkspace() {
  const [activeStage, setActiveStage] = useState<AppStage>("dashboard");
  const [idea, setIdea] = useState(DEFAULT_IDEA);
  const [goalInterview, setGoalInterview] = useState<GoalInterviewResponse | null>(null);
  const [pathMap, setPathMap] = useState<ProjectPathMap | null>(null);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [milestonePlan, setMilestonePlan] = useState<MilestonePlanResponse | null>(null);
  const [activeScaffoldStep, setActiveScaffoldStep] = useState<ScaffoldStep>("story");
  const [draftChecklists, setDraftChecklists] = useState<Record<string, string>>({});
  const [checklistFeedbackByMilestone, setChecklistFeedbackByMilestone] = useState<Record<string, ChecklistFeedbackResponse>>({});
  const [confirmedChecklists, setConfirmedChecklists] = useState<Record<string, string[]>>({});
  const [checklistChecks, setChecklistChecks] = useState<Record<string, Record<string, ChecklistCheckStatus>>>({});
  const [predictionAnswer, setPredictionAnswer] = useState<number | null>(null);
  const [miniExplain, setMiniExplain] = useState<PatchResponse["miniExplainQuestion"] | null>(null);
  const [miniExplainAnswer, setMiniExplainAnswer] = useState<number | null>(null);
  const [code, setCode] = useState(STARTER_CODE);
  const [changeSummary, setChangeSummary] = useState<string[]>([]);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [previewState, setPreviewState] = useState<PreviewState>({ status: "idle", runCount: 0, console: [] });
  const [runKey, setRunKey] = useState(0);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("changes");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [debugDiagnosis, setDebugDiagnosis] = useState<DebugDiagnosisResponse | null>(null);
  const [debugSymptom, setDebugSymptom] = useState("I do not see that part working yet.");
  const [failedChecklistItem, setFailedChecklistItem] = useState("");
  const [trace, setTrace] = useState<LearningTrace>({
    projectId: "draft",
    conceptsTouched: [],
    bugsFixed: [],
    miniExplainAnswers: [],
    decisionsMade: []
  });
  const [assistantLog, setAssistantLog] = useState<string[]>([
    "Share your idea first. I will help turn it into small steps before we make changes."
  ]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setHasLoadedStoredState(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        activeStage?: AppStage;
        idea?: string;
        project?: Project;
        goalInterview?: GoalInterviewResponse;
        pathMap?: ProjectPathMap;
        milestones?: Milestone[];
        selectedMilestoneId?: string;
        activeScaffoldStep?: ScaffoldStep;
        draftChecklists?: Record<string, string>;
        checklistFeedbackByMilestone?: Record<string, ChecklistFeedbackResponse>;
        confirmedChecklists?: Record<string, string[]>;
        checklistChecks?: Record<string, Record<string, ChecklistCheckStatus>>;
        code?: string;
        changeSummary?: string[];
        checkpoints?: Checkpoint[];
        trace?: LearningTrace;
      };
      if (parsed.activeStage) setActiveStage(parsed.activeStage);
      if (parsed.idea) setIdea(parsed.idea);
      if (parsed.project) setProject(parsed.project);
      if (parsed.goalInterview) setGoalInterview(parsed.goalInterview);
      if (parsed.pathMap) setPathMap(parsed.pathMap);
      if (parsed.milestones) setMilestones(parsed.milestones);
      if (parsed.selectedMilestoneId) setSelectedMilestoneId(parsed.selectedMilestoneId);
      if (parsed.activeScaffoldStep) setActiveScaffoldStep(parsed.activeScaffoldStep);
      if (parsed.draftChecklists) setDraftChecklists(parsed.draftChecklists);
      if (parsed.checklistFeedbackByMilestone) setChecklistFeedbackByMilestone(parsed.checklistFeedbackByMilestone);
      if (parsed.confirmedChecklists) setConfirmedChecklists(parsed.confirmedChecklists);
      if (parsed.checklistChecks) setChecklistChecks(parsed.checklistChecks);
      if (parsed.code) setCode(parsed.code);
      if (parsed.changeSummary) setChangeSummary(parsed.changeSummary);
      if (parsed.checkpoints) setCheckpoints(parsed.checkpoints);
      if (parsed.trace) setTrace(parsed.trace);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasLoadedStoredState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredState) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeStage,
        idea,
        goalInterview,
        pathMap,
        project,
        milestones,
        selectedMilestoneId,
        activeScaffoldStep,
        draftChecklists,
        checklistFeedbackByMilestone,
        confirmedChecklists,
        checklistChecks,
        code,
        changeSummary,
        checkpoints,
        trace
      })
    );
  }, [
    activeStage,
    idea,
    goalInterview,
    pathMap,
    project,
    milestones,
    selectedMilestoneId,
    activeScaffoldStep,
    draftChecklists,
    checklistFeedbackByMilestone,
    confirmedChecklists,
    checklistChecks,
    code,
    changeSummary,
    checkpoints,
    trace,
    hasLoadedStoredState
  ]);

  const selectedMilestone = useMemo(
    () => milestones.find((milestone) => milestone.id === selectedMilestoneId) ?? milestones[0],
    [milestones, selectedMilestoneId]
  );
  const nextMilestone = nextMilestoneAfter(milestones, selectedMilestone);
  const selectedMilestoneKey = selectedMilestone?.id ?? "";
  const draftChecklist = selectedMilestoneKey ? draftChecklists[selectedMilestoneKey] ?? "" : "";
  const checklistFeedback = selectedMilestoneKey ? checklistFeedbackByMilestone[selectedMilestoneKey] : undefined;
  const currentChecklist = selectedMilestoneKey ? confirmedChecklists[selectedMilestoneKey] ?? [] : [];
  const currentChecklistChecks = selectedMilestoneKey ? checklistChecks[selectedMilestoneKey] ?? {} : {};
  const completedChecklistCount = currentChecklist.filter((item) => currentChecklistChecks[item] === "yes").length;
  const allChecklistDone = currentChecklist.length > 0 && completedChecklistCount === currentChecklist.length;
  const firstUncheckedChecklistItem =
    currentChecklist.find((item) => currentChecklistChecks[item] !== "yes") || currentChecklist[0] || selectedMilestone?.doneChecklist[0];
  const currentStepIsDone = Boolean(selectedMilestone?.status === "done" || allChecklistDone);
  const activeCheckpoint = checkpoints[checkpoints.length - 1];
  const projectTitle = project?.title ?? pathMap?.title ?? "School Quiz Game";
  const currentSystemCards = systemCardsForMilestone(selectedMilestone?.order);

  const appendAssistantLog = useCallback((message: string) => {
    setAssistantLog((messages) => [message, ...messages].slice(0, 5));
  }, []);

  const handleConsole = useCallback((line: string) => {
    setPreviewState((state) => ({
      ...state,
      console: [`[preview] ${line}`, ...state.console].slice(0, 20)
    }));
  }, []);

  const handlePreviewError = useCallback((message: string) => {
    setPreviewState((state) => ({
      ...state,
      status: "error",
      error: message,
      console: [`[error] ${message}`, ...state.console].slice(0, 20)
    }));
    setActiveStage("preview");
    setDrawerOpen(true);
    setDrawerTab("console");
    appendAssistantLog("The preview found a problem. Pick what is missing, then fix one small thing.");
    if (selectedMilestone) {
      setMilestones((items) => updateMilestone(items, selectedMilestone.id, { status: "needs_fix" }));
    }
  }, [appendAssistantLog, selectedMilestone]);

  function canOpenStage(stage: AppStage): boolean {
    if (stage === "dashboard") return true;
    if (stage === "flowchart") return Boolean(goalInterview || project);
    return Boolean(project);
  }

  function openStage(stage: AppStage) {
    if (canOpenStage(stage)) setActiveStage(stage);
  }

  function handleResetWorkspace() {
    setActiveStage("dashboard");
    setIdea(DEFAULT_IDEA);
    setGoalInterview(null);
    setPathMap(null);
    setProject(null);
    setMilestones([]);
    setSelectedMilestoneId("");
    setMilestonePlan(null);
    setActiveScaffoldStep("story");
    setDraftChecklists({});
    setChecklistFeedbackByMilestone({});
    setConfirmedChecklists({});
    setChecklistChecks({});
    setPredictionAnswer(null);
    setMiniExplain(null);
    setMiniExplainAnswer(null);
    setCode(STARTER_CODE);
    setChangeSummary([]);
    setChecklistState({});
    setPreviewState({ status: "idle", runCount: 0, console: [] });
    setRunKey((key) => key + 1);
    setDrawerOpen(false);
    setCheckpoints([]);
    setDebugDiagnosis(null);
    setFailedChecklistItem("");
    setDraftAnswer("");
    setDebugSymptom("I do not see that part working yet.");
    setTrace({
      projectId: "draft",
      conceptsTouched: [],
      bugsFixed: [],
      miniExplainAnswers: [],
      decisionsMade: []
    });
    setAssistantLog(["Share your idea first. I will help turn it into small steps before we make changes."]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  async function handleStartGoalInterview() {
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<GoalInterviewResponse>("/api/goal/interview/start", { idea });
      setGoalInterview(response);
      setPathMap(response.pathMap);
      setDraftAnswer("");
      setChangeSummary(["Goal interview started. The map is drafting, but no code was generated."]);
      setActiveStage("flowchart");
      appendAssistantLog(response.assistantMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Goal interview failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAnswerGoalQuestion(answer: string) {
    if (!goalInterview?.nextQuestion || !answer.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<GoalInterviewResponse>("/api/goal/interview/answer", {
        idea,
        turns: goalInterview.turns,
        questionId: goalInterview.nextQuestion.id,
        answer: answer.trim()
      });
      setGoalInterview(response);
      setPathMap(response.pathMap);
      setDraftAnswer("");
      setChangeSummary([`Path map updated from answer: ${answer.trim()}`]);
      setActiveStage("flowchart");
      appendAssistantLog(response.assistantMessage);
      setTrace((current) => ({
        ...current,
        decisionsMade: mergeUnique(current.decisionsMade, [`Goal interview: ${answer.trim()}`])
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Goal answer failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGeneratePath() {
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<ProjectPathResponse>("/api/project/path", {
        idea,
        interviewTurns: goalInterview?.turns ?? [],
        pathMap
      });
      setProject(response.project);
      setMilestones(response.milestones);
      setSelectedMilestoneId(response.project.currentMilestoneId);
      setPathMap(response.pathMap);
      setCode(response.starterCode);
      setMilestonePlan(null);
      setMiniExplain(null);
      setChecklistState({});
      setActiveScaffoldStep("story");
      setDraftChecklists({});
      setChecklistFeedbackByMilestone({});
      setConfirmedChecklists({});
      setChecklistChecks({});
      setDrawerOpen(false);
      setChangeSummary(["Your step map is ready. No code was changed yet."]);
      setTrace({
        projectId: response.project.id,
        conceptsTouched: [],
        bugsFixed: [],
        miniExplainAnswers: [],
        decisionsMade: [
          `Generated project path: ${response.project.title}`,
          ...(goalInterview?.turns.map((turn) => `${turn.prompt} ${turn.answer}`) ?? [])
        ]
      });
      setActiveStage("milestones");
      appendAssistantLog(response.assistantMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Path generation failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePlanMilestone() {
    if (!selectedMilestone) return;
    if (!currentChecklist.length) {
      setActiveScaffoldStep("checklist");
      appendAssistantLog("Write your own checklist first. Then AI can help make it easier to check.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<MilestonePlanResponse>("/api/milestone/plan", {
        milestone: selectedMilestone
      });
      setMilestonePlan(response);
      setPredictionAnswer(null);
      setMiniExplain(null);
      setMiniExplainAnswer(null);
      setActiveScaffoldStep("logic");
      setMilestones((items) => updateMilestone(items, selectedMilestone.id, { status: "in_progress" }));
      setActiveStage("milestones");
      appendAssistantLog(`Now focus only on: ${response.milestone.title}. Use the logic map, then make one change.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Milestone planning failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReviewChecklist() {
    if (!selectedMilestone || !draftChecklist.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      const feedback = await postJson<ChecklistFeedbackResponse>("/api/checklist/review", {
        milestone: selectedMilestone,
        draftChecklist
      });
      setChecklistFeedbackByMilestone((items) => ({ ...items, [selectedMilestone.id]: feedback }));
      setActiveScaffoldStep("checklist");
      appendAssistantLog(feedback.assistantMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Checklist feedback failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleConfirmChecklist(useImproved = true) {
    if (!selectedMilestone) return;
    const fallbackItems = parseChecklistText(draftChecklist);
    const confirmed = (useImproved && checklistFeedback?.improvedChecklist.length ? checklistFeedback.improvedChecklist : fallbackItems).slice(0, 4);

    if (confirmed.length < 2) {
      setError("Write at least 2 things you can see or test.");
      setActiveScaffoldStep("checklist");
      return;
    }

    const updatedMilestone: Milestone = {
      ...selectedMilestone,
      doneChecklist: confirmed,
      status: "in_progress"
    };
    setConfirmedChecklists((items) => ({ ...items, [selectedMilestone.id]: confirmed }));
    setChecklistChecks((items) => ({
      ...items,
      [selectedMilestone.id]: Object.fromEntries(confirmed.map((item) => [item, "not_yet" as ChecklistCheckStatus]))
    }));
    setChecklistState(Object.fromEntries(confirmed.map((item) => [item, false])));
    setMilestones((items) => updateMilestone(items, selectedMilestone.id, updatedMilestone));
    setActiveScaffoldStep("logic");

    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<MilestonePlanResponse>("/api/milestone/plan", {
        milestone: updatedMilestone
      });
      setMilestonePlan(response);
      setPredictionAnswer(null);
      setMiniExplain(null);
      setMiniExplainAnswer(null);
      appendAssistantLog("Shared checklist confirmed. Now the logic map can show how the step works.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Logic map failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleApplyPatch() {
    if (!selectedMilestone || !project) return;
    if (!currentChecklist.length) {
      setActiveScaffoldStep("checklist");
      appendAssistantLog("Confirm the checklist first so the build has a clear target.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const patch = await postJson<PatchResponse>("/api/build/patch", {
        milestone: selectedMilestone,
        currentCode: code
      });
      const nextPreviewState: PreviewState = {
        ...previewState,
        status: "idle",
        error: undefined
      };
      const checkpoint = await postJson<Checkpoint>("/api/checkpoint/create", {
        projectId: project.id,
        milestoneId: selectedMilestone.id,
        name: patch.checkpointName,
        filesSnapshot: { "sketch.js": patch.code },
        previewState: nextPreviewState
      });
      setCode(patch.code);
      setChangeSummary(patch.changeSummary);
      setMiniExplain(patch.miniExplainQuestion);
      setMiniExplainAnswer(null);
      setCheckpoints((items) => [...items, checkpoint]);
      setTrace((current) => ({
        ...current,
        conceptsTouched: mergeUnique(current.conceptsTouched, patch.learningTraceDelta.conceptsTouched),
        decisionsMade: mergeUnique(current.decisionsMade, patch.learningTraceDelta.decisionsMade)
      }));
      setDrawerTab("changes");
      setDrawerOpen(true);
      setActiveScaffoldStep("preview");
      appendAssistantLog("One small change is ready. Run the preview, then check what you can see.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Patch failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRunPreview() {
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<PreviewState>("/api/preview/run", {
        code,
        runCount: previewState.runCount
      });
      setPreviewState((state) => ({
        ...state,
        ...response,
        console: [...response.console, ...state.console].slice(0, 20)
      }));
      setRunKey((key) => key + 1);
      setDrawerTab("console");
      setActiveScaffoldStep("preview");
      appendAssistantLog("Preview ran. Look at the app first, then check the boxes you can see.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Preview failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDiagnoseDebug() {
    if (!selectedMilestone) return;
    setIsBusy(true);
    setError(null);
    try {
      const diagnosis = await postJson<DebugDiagnosisResponse>("/api/debug/diagnose", {
        visibleBehavior: debugSymptom,
        failedChecklistItem: failedChecklistItem || firstUncheckedChecklistItem,
        milestone: selectedMilestone
      });
      setDebugDiagnosis(diagnosis);
      setActiveStage("preview");
      setActiveScaffoldStep("preview");
      setMilestones((items) => updateMilestone(items, selectedMilestone.id, { status: "needs_fix" }));
      appendAssistantLog("Debug from what you see: pick what is missing, then try the smallest fix.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Debug diagnosis failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRollback(checkpoint: Checkpoint) {
    setIsBusy(true);
    setError(null);
    try {
      const restored = await postJson<{ restoredCode: string; previewState: PreviewState }>("/api/checkpoint/rollback", {
        checkpoint
      });
      setCode(restored.restoredCode);
      setPreviewState(restored.previewState);
      setChangeSummary([`Rolled back to: ${checkpoint.name}`]);
      setDrawerTab("history");
      setDrawerOpen(true);
      appendAssistantLog(`Rolled back to: ${checkpoint.name}. Run the preview again to confirm.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Rollback failed");
    } finally {
      setIsBusy(false);
    }
  }

  function handleChecklistToggle(item: string) {
    const next = checklistState[item] ? "not_yet" : "yes";
    handleChecklistStatus(item, next);
  }

  function handleChecklistStatus(item: string, status: ChecklistCheckStatus) {
    if (!selectedMilestone) return;
    setChecklistChecks((state) => ({
      ...state,
      [selectedMilestone.id]: {
        ...(state[selectedMilestone.id] ?? {}),
        [item]: status
      }
    }));
    setChecklistState((state) => ({ ...state, [item]: status === "yes" }));
    if (status !== "yes") {
      setFailedChecklistItem(item);
      setDebugSymptom(status === "unsure" ? `I am not sure if this happened: ${grade3Copy(item)}` : `I do not see this yet: ${grade3Copy(item)}`);
    }
  }

  function handleCompleteMilestone() {
    if (!selectedMilestone) return;
    setMilestones((items) => updateMilestone(items, selectedMilestone.id, { status: "done" }));
    setActiveScaffoldStep("explain");
    appendAssistantLog("Step marked done. Answer one quick check, then move to the next small step.");
  }

  function handleMiniExplainAnswer(optionIndex: number) {
    if (!miniExplain) return;
    setMiniExplainAnswer(optionIndex);
    const answer = miniExplain.options[optionIndex];
    setTrace((current) => ({
      ...current,
      miniExplainAnswers: mergeUnique(current.miniExplainAnswers, [answer])
    }));
    setActiveScaffoldStep("explain");
    appendAssistantLog(optionIndex === miniExplain.correctIndex ? "Right. That is enough explanation for this step." : "Close. Keep watching how the preview changes.");
  }

  function handleSelectNextMilestone() {
    if (!selectedMilestone) return;
    const next = nextMilestoneAfter(milestones, selectedMilestone);
    if (!next) {
      if (project) setProject({ ...project, status: "complete" });
      appendAssistantLog("The small version is connected. You can polish it next.");
      return;
    }

    setSelectedMilestoneId(next.id);
    setMilestonePlan(null);
    setPredictionAnswer(null);
    setMiniExplain(null);
    setMiniExplainAnswer(null);
    setDebugDiagnosis(null);
    setFailedChecklistItem("");
    setChecklistState({});
    setActiveScaffoldStep("story");
    setActiveStage("milestones");
    appendAssistantLog(`Next step: ${next.title}. Plan it, then check what you can see.`);
  }

  function handleSelectMilestone(milestone: Milestone) {
    setSelectedMilestoneId(milestone.id);
    setMilestonePlan(null);
    setPredictionAnswer(null);
    setMiniExplain(null);
    setMiniExplainAnswer(null);
    setDebugDiagnosis(null);
    setChecklistState({});
    setActiveScaffoldStep("story");
    setActiveStage("milestones");
  }

  function renderToolDrawer() {
    const tabs: Array<{ id: DrawerTab; label: string; icon: typeof ListChecks }> = [
      { id: "changes", label: "Changes", icon: ListChecks },
      { id: "code", label: "Code", icon: Code2 },
      { id: "console", label: "Messages", icon: ChevronDown },
      { id: "history", label: "Saved steps", icon: RotateCcw }
    ];

    return (
      <section className={`tool-drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                className={drawerTab === tab.id ? "active" : ""}
                type="button"
                key={tab.id}
                onClick={() => {
                  setDrawerTab(tab.id);
                  setDrawerOpen(true);
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
          <button className="drawer-toggle" type="button" onClick={() => setDrawerOpen((open) => !open)}>
            {drawerOpen ? "Hide" : "Show details"}
          </button>
        </div>
        {drawerOpen && (
          <div className="drawer-content">
            {drawerTab === "changes" && (
              <ul className="summary-list">
                {changeSummary.length ? changeSummary.map((item) => <li key={item}>{grade3Copy(item)}</li>) : <li>No changes yet.</li>}
              </ul>
            )}
            {drawerTab === "code" && <pre className="code-block">{code}</pre>}
            {drawerTab === "console" && (
              <pre className="console-block">{previewState.console.length ? previewState.console.join("\n") : "Preview messages will appear after you run it."}</pre>
            )}
            {drawerTab === "history" && (
              <div className="history-list">
                {checkpoints.length === 0 ? (
                  <p className="muted">No saved step yet.</p>
                ) : (
                  checkpoints.map((checkpoint) => (
                    <div className="history-row" key={checkpoint.id}>
                      <div>
                        <strong>{checkpoint.name}</strong>
                        <span>{new Date(checkpoint.createdAt).toLocaleString()}</span>
                      </div>
                      <button className="secondary-button compact" type="button" onClick={() => handleRollback(checkpoint)}>
                        <RotateCcw size={15} />
                        Roll back
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  function renderDashboard() {
    const canMakeMap = Boolean(goalInterview?.readiness.canGeneratePath);
    const ideaCtaLabel = canMakeMap ? "Make my project map" : goalInterview ? "Keep answering questions" : "Make my project map";

    return (
      <section className="idea-studio-screen">
        <button type="button" className="studio-back-link" onClick={() => project && setActiveStage("milestones")} disabled={!project}>
          <ArrowLeft size={17} />
          Back to Milestones
        </button>

        <div className="studio-title-block">
          <span className="step-pill">Step 1 of 5</span>
          <h1>
            <Wand2 size={28} />
            Idea Studio
          </h1>
          <p>We will turn your idea into a clear game plan.</p>
          <span className="grade-pill">
            <BookOpen size={15} />
            Grade 3
          </span>
        </div>

        <div className="idea-studio-grid">
          <section className="idea-entry-panel">
            <div className="panel-kicker amber">
              <Lightbulb size={18} />
              <strong>Start with your idea</strong>
              <Sparkles size={15} />
            </div>
            <h2>What do you want to make?</h2>
            <p>Tell us your idea in your own words.</p>
            <label className="idea-textbox">
              <textarea
                maxLength={500}
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                aria-label="Project idea"
              />
              <CheckCircle2 size={18} />
            </label>

            <div className="starter-prompt">
              <strong>Not sure where to start?</strong>
              <span>Pick one to help get ideas flowing.</span>
            </div>
            <div className="idea-helper-list">
              {helperChoices.map((choice) => {
                const Icon = choice.icon;
                return (
                  <button
                    type="button"
                    key={choice.label}
                    onClick={() => setIdea(choice.label === "Describe it myself" ? DEFAULT_IDEA : `${DEFAULT_IDEA} I want it to start with ${choice.label.toLowerCase()}.`)}
                  >
                    <Icon size={18} />
                    <span>{choice.label}</span>
                    <ArrowRight size={16} />
                  </button>
                );
              })}
            </div>
            <div className="studio-tip warm">
              <Lightbulb size={17} />
              <span>Tip: There is no perfect answer. We can change things later.</span>
            </div>
          </section>

          <section className="idea-visual-panel">
            <div className="panel-kicker blue">
              <Target size={18} />
              <div>
                <strong>Your project idea</strong>
                <span>Here is how we picture your game.</span>
              </div>
            </div>

            <div className="quiz-hero-art" aria-label="School quiz game preview">
              <div className="art-sky">
                <span className="cloud one" />
                <span className="cloud two" />
                <span className="school-roof" />
                <div className="quiz-title-board">School Quiz</div>
                <button type="button">Start</button>
                <div className="sample-question">
                  <strong>What is the name of our school?</strong>
                  <span>Lincoln Elementary</span>
                  <span>Riverside School</span>
                  <span>Maple Academy</span>
                </div>
                <div className="score-badge">
                  <span>Score</span>
                  <strong>0</strong>
                  <Star size={18} />
                </div>
              </div>
            </div>

            <div className="players-might-panel">
              <strong>What players might see and do</strong>
              <ul>
                <li>
                  <Play size={18} />
                  They click Start on the title screen.
                </li>
                <li>
                  <CircleHelp size={18} />
                  They see a question and choose an answer.
                </li>
                <li>
                  <Star size={18} />
                  They earn points and the score is shown.
                </li>
              </ul>
            </div>
            <p className="studio-note">
              <Sparkles size={18} />
              We will build a plan based on your choices.
            </p>
          </section>

          <section className="clarify-panel">
            <div className="panel-kicker violet">
              <Wand2 size={18} />
              <div>
                <strong>Let us make your idea clearer</strong>
                <span>Choose what feels right. You can change anything later.</span>
              </div>
            </div>

            {[
              {
                question: "What should someone do first?",
                options: ["See a title screen", "Go straight to a question", "See how to play"],
                icon: Play
              },
              {
                question: "What should the game show next?",
                options: ["A question", "How to play", "A topic choice"],
                icon: CircleHelp
              },
              {
                question: "What should happen when they click?",
                options: ["Check the answer", "Go to the next question", "Show the score"],
                icon: MousePointerClick
              }
            ].map((prompt, promptIndex) => {
              const Icon = prompt.icon;
              return (
                <article className="clarify-question" key={prompt.question}>
                  <div>
                    <span>{promptIndex + 1}</span>
                    <strong>{prompt.question}</strong>
                  </div>
                  <div className="clarify-options">
                    {prompt.options.map((option, optionIndex) => (
                      <button
                        className={optionIndex === 0 ? "selected" : ""}
                        type="button"
                        key={option}
                        onClick={() => setIdea(`${DEFAULT_IDEA} ${option}.`)}
                      >
                        {option}
                        {optionIndex === 0 && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                  <label>
                    <Icon size={16} />
                    <input placeholder="Or type your own idea..." aria-label={`${prompt.question} custom answer`} />
                  </label>
                </article>
              );
            })}

            <button
              className="primary-button map-cta"
              type="button"
              onClick={canMakeMap ? handleGeneratePath : goalInterview ? () => setActiveStage("flowchart") : handleStartGoalInterview}
              disabled={isBusy || !idea.trim()}
            >
              <Map size={18} />
              {ideaCtaLabel}
              <ArrowRight size={18} />
            </button>
            <small>
              <LockIcon />
              We will create your plan in the next step.
            </small>
          </section>
        </div>

        <section className="starter-strip" aria-label="Example project starters">
          {starterCards.map((card) => {
            const Icon = card.icon;
            return (
              <button className={`starter-mini ${card.tone}`} type="button" key={card.title} onClick={() => setIdea(card.idea)}>
                <Icon size={19} />
                <span>{card.title}</span>
              </button>
            );
          })}
        </section>
      </section>
    );
  }

  function LockIcon() {
    return (
      <span aria-hidden="true" className="tiny-lock">
        •
      </span>
    );
  }

  function renderFlowchart() {
    const canGeneratePath = Boolean(goalInterview?.readiness.canGeneratePath);
    const visibleFlowNodes = milestones.length
      ? milestones.map((milestone) => ({
          id: milestone.id,
          order: milestone.order,
          label: milestone.title,
          detail: grade3Copy(milestone.visibleOutput),
          status: milestone.status,
          icon: milestone.order === 1 ? Gamepad2 : milestone.order === 2 ? CircleHelp : milestone.order === 3 ? MessageCircle : milestone.order === 4 ? Trophy : ListChecks
        }))
      : (pathMap?.nodes ?? []).map((node, index) => ({
          id: node.id,
          order: index + 1,
          label: node.label,
          detail: grade3Copy(node.detail),
          status: node.status,
          icon: node.type === "goal" ? Target : node.type === "experience" ? Gamepad2 : node.type === "mechanic" ? GitBranch : MessageCircle
        }));
    const suggestedIndex = Math.max(
      0,
      visibleFlowNodes.findIndex((node) => node.status === "open" || node.status === "in_progress")
    );

    return (
      <section className="flow-studio-screen">
        <aside className="flow-idea-rail">
          <h2>
            <Lightbulb size={22} />
            Your idea
          </h2>
          <article>
            <strong>Your goal</strong>
            <p>{idea}</p>
          </article>
          <article>
            <strong>System summary</strong>
            <p>{pathMap?.summary ?? "Players start the game, answer a question, get feedback, and see a score."}</p>
          </article>
          <article>
            <strong>What this flow shows</strong>
            <ul>
              <li>The key steps in your game</li>
              <li>How players move through it</li>
              <li>Where we can build first</li>
            </ul>
          </article>
          <div className="studio-tip violet-tip">
            <Sparkles size={18} />
            <span>You can reorder, rename, and connect steps. Start small and build as you go.</span>
          </div>
        </aside>

        <section className="flow-board-panel">
          <div className="flow-board-header">
            <div>
              <h1>
                <Workflow size={25} />
                Project Flowchart
              </h1>
              <p>This is the whole system. Each box is a step in your game.</p>
            </div>
            <div className="flow-controls">
              <button type="button" className="secondary-button compact">
                Fit view
              </button>
              <button type="button" className="secondary-button compact" disabled>
                <Minus size={14} />
                100%
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="vertical-flow-canvas">
            {visibleFlowNodes.map((node, index) => {
              const Icon = node.icon;
              const nodeIsCurrent = index === suggestedIndex || node.status === "in_progress";
              return (
                <div className="vertical-flow-item" key={node.id}>
                  <article className={`vertical-flow-node ${node.status} ${nodeIsCurrent ? "current" : ""}`}>
                    <span className="node-number">{node.order}</span>
                    <span className="node-icon">
                      <Icon size={26} />
                    </span>
                    <div>
                      <strong>{node.label}</strong>
                      <p>{node.detail}</p>
                      {nodeIsCurrent && <em>Suggested first small step</em>}
                    </div>
                    <MoreHorizontal size={17} />
                  </article>
                  {index < visibleFlowNodes.length - 1 && <ArrowDownConnector />}
                </div>
              );
            })}
            {!visibleFlowNodes.length && (
              <article className="vertical-flow-node open current">
                <span className="node-number">?</span>
                <span className="node-icon">
                  <Sparkles size={26} />
                </span>
                <div>
                  <strong>Unknown first step</strong>
                  <p>Answer one question so the map can begin.</p>
                </div>
              </article>
            )}
          </div>

          <div className="flow-board-footer">
            <button className="secondary-button compact" type="button" disabled>
              <Plus size={16} />
              Add step
            </button>
            <span>Drag steps to reorder · Click a step to edit · Connectors show the system</span>
            <div>
              <button type="button" className="icon-button" disabled>
                <RotateCcw size={16} />
              </button>
              <button type="button" className="icon-button" disabled>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <aside className="path-choice-rail">
          <section className="path-card">
            <h2>
              <Sparkles size={22} />
              Choose a path
            </h2>
            <p>Pick a recommended path, or create your own.</p>
            {[
              { title: "Build a playable version first", detail: "Get a minimal game working fast and playable early.", accent: "amber", numbers: [1, 2, 3, 4, 5] },
              { title: "Design the start screen first", detail: "Create a great first impression before the core gameplay.", accent: "teal", numbers: [1, 3, 2, 4, 5] },
              { title: "Build the core interaction first", detail: "Focus on the question and feedback loop first.", accent: "violet", numbers: [1, 2, 3, 5, 4] }
            ].map((option, index) => (
              <button className={`path-option ${option.accent} ${index === 0 ? "selected" : ""}`} type="button" key={option.title}>
                <span className="path-number-row">
                  {option.numbers.map((number) => (
                    <i key={number}>{number}</i>
                  ))}
                </span>
                <strong>{option.title}</strong>
                <p>{option.detail}</p>
                {index === 0 && <em>Recommended</em>}
              </button>
            ))}
            <button className="secondary-button mix-path" type="button" disabled>
              <GitBranch size={18} />
              Mix my own path
            </button>
          </section>

          <section className="question-card flow-question-card">
            <div className="card-title">
              <Sparkles size={18} />
              <h2>{goalInterview?.readiness.canGeneratePath ? "Ready to build small" : "AI asks one question"}</h2>
            </div>
            {!goalInterview ? (
              <>
                <p>Start with one small question. The map will grow as you answer.</p>
                <button className="primary-button" type="button" onClick={handleStartGoalInterview} disabled={isBusy}>
                  Start asking
                </button>
              </>
            ) : goalInterview.nextQuestion ? (
              <div className="question-block">
                <span className="question-kicker">{goalInterview.progressLabel}</span>
                <strong>{goalInterview.nextQuestion.prompt}</strong>
                <div className="option-list">
                  {goalInterview.nextQuestion.options.map((option) => (
                    <button
                      className={`choice-button ${draftAnswer === option ? "selected" : ""}`}
                      key={option}
                      type="button"
                      onClick={() => setDraftAnswer(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <input
                  aria-label="Custom goal interview answer"
                  placeholder="Or type your answer..."
                  value={draftAnswer}
                  onChange={(event) => setDraftAnswer(event.target.value)}
                />
                <button className="secondary-button" type="button" onClick={() => handleAnswerGoalQuestion(draftAnswer)} disabled={isBusy || !draftAnswer.trim()}>
                  <ArrowRight size={16} />
                  Answer and grow map
                </button>
              </div>
            ) : (
              <p>We have enough choices to start one small step.</p>
            )}
            <button className="primary-button" type="button" onClick={handleGeneratePath} disabled={isBusy || !canGeneratePath}>
              Choose this as my next milestone
              <ArrowRight size={16} />
            </button>
            {!canGeneratePath && goalInterview && <small>{Math.max(0, goalInterview.readiness.requiredCount - goalInterview.readiness.answeredCount)} more answer(s) before we build.</small>}
          </section>
        </aside>
      </section>
    );
  }

  function ArrowDownConnector() {
    return (
      <span className="down-connector" aria-hidden="true">
        ↓
      </span>
    );
  }

  function renderChecklistWorkshop() {
    const draftItems = parseChecklistText(draftChecklist);

    return (
      <section className="panel checklist-workshop">
        <div className="panel-header">
          <div>
            <h2>
              <ListChecks size={20} />
              My checklist
              <span>your draft</span>
            </h2>
            <p>Write what your game should do in this step.</p>
          </div>
          <button
            className="secondary-button compact"
            type="button"
            onClick={() =>
              selectedMilestone &&
              setDraftChecklists((items) => ({
                ...items,
                [selectedMilestone.id]: `${draftChecklist}${draftChecklist ? "\n" : ""}I can...`
              }))
            }
            disabled={!selectedMilestone}
          >
            <Plus size={15} />
            Add item
          </button>
        </div>

        <div className="checklist-draft-grid">
          <div className="checklist-draft-list">
            {(draftItems.length ? draftItems : ["I can click an answer.", "The game says Correct if the answer is right.", "The game says Try again if the answer is wrong."]).map((item, index) => {
              const isMissing = Boolean(checklistFeedback?.missingStep.some((feedback) => feedback.text === item));
              const isVague = Boolean(checklistFeedback?.tooVague.some((feedback) => feedback.text === item));
              const label = !checklistFeedback ? "Draft" : isMissing ? "Missing a step" : isVague ? "Too vague" : "Easy to check";
              const rowState = !checklistFeedback ? "draft" : isMissing ? "missing" : isVague ? "vague" : "good";
              return (
                <div className={`draft-row ${rowState}`} key={`${item}-${index}`}>
                  <span className="drag-dots">⋮⋮</span>
                  <input
                    value={item}
                    onChange={(event) => {
                      if (!selectedMilestone) return;
                      const next = [...draftItems];
                      next[index] = event.target.value;
                      setDraftChecklists((items) => ({ ...items, [selectedMilestone.id]: next.join("\n") }));
                    }}
                    aria-label={`Checklist item ${index + 1}`}
                  />
                  <button type="button" disabled>
                    {label}
                    <ChevronDown size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <aside className="ai-feedback-summary-card">
            <h3>
              <Sparkles size={18} />
              AI feedback
            </h3>
            {checklistFeedback ? (
              <>
                <div className="feedback-score-row good">
                  <Check size={16} />
                  Easy to check
                  <strong>{checklistFeedback.goodAndCheckable.length}</strong>
                </div>
                <div className="feedback-score-row vague">
                  <CircleHelp size={16} />
                  Too vague
                  <strong>{checklistFeedback.tooVague.length}</strong>
                </div>
                <div className="feedback-score-row missing">
                  <Flag size={16} />
                  Missing a step
                  <strong>{checklistFeedback.missingStep.length}</strong>
                </div>
                <p>{checklistFeedback.assistantMessage}</p>
              </>
            ) : (
              <>
                <p>Ask AI to check if your list is easy to test.</p>
                <button className="primary-button compact" type="button" onClick={handleReviewChecklist} disabled={!selectedMilestone || !draftChecklist.trim() || isBusy}>
                  <Sparkles size={15} />
                  Check my list
                </button>
              </>
            )}
          </aside>
        </div>

        <textarea
          className="checklist-workshop-textarea"
          value={draftChecklist}
          placeholder={"I can click an answer.\nThe game says Correct if the answer is right.\nThe game says Try again if the answer is wrong."}
          onChange={(event) =>
            selectedMilestone &&
            setDraftChecklists((items) => ({
              ...items,
              [selectedMilestone.id]: event.target.value
            }))
          }
          aria-label="Student checklist draft"
        />

        {checklistFeedback && (
          <div className="ai-revision-card">
            <div>
              <strong>
                <Sparkles size={17} />
                AI suggested revision
              </strong>
              <span>Clearer and more complete</span>
            </div>
            <ul>
              {checklistFeedback.improvedChecklist.map((item) => (
                <li key={item}>
                  <Check size={15} />
                  {grade3Copy(item)}
                  <em>Easy to check</em>
                </li>
              ))}
            </ul>
            <div className="button-row">
              <button className="primary-button compact" type="button" onClick={() => handleConfirmChecklist(true)} disabled={isBusy}>
                Use this
              </button>
              <button className="secondary-button compact" type="button" onClick={() => setActiveScaffoldStep("checklist")}>
                <Pencil size={14} />
                Edit it
              </button>
              <button className="secondary-button compact" type="button" onClick={() => handleConfirmChecklist(false)} disabled={isBusy}>
                Keep mine
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  function renderCenterLogicMap() {
    return (
      <section className="panel center-logic-map">
        <div className="panel-header">
          <div>
            <h2>
              <Workflow size={20} />
              Visual logic map
            </h2>
            <p>This is how your system will work.</p>
          </div>
          <button className="secondary-button compact" type="button" onClick={handlePlanMilestone} disabled={!currentChecklist.length || isBusy}>
            Create logic
          </button>
        </div>
        <div className="logic-card-row">
          {(milestonePlan?.logicSketch.length ? milestonePlan.logicSketch : currentSystemCards.map((card) => card.title)).map((logicStep, index) => (
            <article className="logic-card" key={`${logicStep}-${index}`}>
              <span>{index + 1}</span>
              <strong>{grade3Copy(logicStep)}</strong>
              <p>{index === 0 ? "What the player does." : index === 1 ? "What the game checks." : "What the player sees."}</p>
              {index < Math.min(3, (milestonePlan?.logicSketch.length || currentSystemCards.length)) - 1 && <ArrowRight size={18} />}
            </article>
          ))}
        </div>
        {milestonePlan && (
          <div className="logic-question-inline">
            <strong>{milestonePlan.predictionQuestion.prompt}</strong>
            {milestonePlan.predictionQuestion.options.map((option, index) => (
              <button className={predictionAnswer === index ? "selected" : ""} type="button" key={option} onClick={() => setPredictionAnswer(index)}>
                {grade3Copy(option)}
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderMilestones() {
    const beforeAfter = beforeAfterForMilestone(selectedMilestone);
    const canBuild = Boolean(milestonePlan && currentChecklist.length && predictionAnswer !== null);

    return (
      <section className="stage-view milestone-room">
        <div className="project-topline">
          <button type="button" className="back-button" onClick={() => setActiveStage("flowchart")}>
            <ArrowLeft size={17} />
            Map
          </button>
          <div className="project-title-block">
            <span className="project-avatar">
              <Gamepad2 size={24} />
            </span>
            <div>
              <h1>{projectTitle}</h1>
              <p>Goal: {project?.originalIdea ?? idea}</p>
            </div>
            <em>In progress</em>
          </div>
          <div className="stage-actions">
            <button className="primary-button compact" type="button" onClick={handleRunPreview} disabled={!project || isBusy}>
              <Play size={16} />
              Run preview
            </button>
            <button className="icon-button" type="button" onClick={() => setDrawerOpen((open) => !open)} title="More">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="milestone-room-grid">
          <aside className="room-map">
            <section className="panel">
              <div className="panel-header">
                <h2>Project map</h2>
                <button type="button" className="mini-button" onClick={() => setActiveStage("flowchart")}>
                  Expand
                </button>
              </div>
              <div className="project-flow-list">
                {milestones.map((milestone) => (
                  <button
                    className={`project-flow-row ${milestone.id === selectedMilestoneId ? "active" : ""} ${milestone.status}`}
                    type="button"
                    key={milestone.id}
                    onClick={() => handleSelectMilestone(milestone)}
                  >
                    <span>{milestone.status === "done" ? <Check size={15} /> : milestone.order}</span>
                    <strong>{milestone.title}</strong>
                    {milestone.id === selectedMilestoneId && <em>Current</em>}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel bounded-card">
              <div className="card-title">
                <Flag size={18} />
                <h2>Current small step</h2>
              </div>
              {selectedMilestone ? (
                <>
                  <strong>{selectedMilestone.title}</strong>
                  <p>{grade3Copy(selectedMilestone.visibleOutput)}</p>
                  <small>Small step · about 15-25 min</small>
                  <button className="primary-button" type="button" onClick={() => setActiveScaffoldStep("checklist")} disabled={isBusy}>
                    <ListChecks size={16} />
                    Write my checklist
                  </button>
                </>
              ) : (
                <p>No milestone selected.</p>
              )}
            </section>

            <section className="panel cue-panel">
              <div className="panel-header">
                <h2>Visual cues</h2>
              </div>
              <div className="cue-grid">
                {visualCues.map((cue) => {
                  const Icon = cue.icon;
                  return (
                    <div className="cue-chip" key={cue.label}>
                      <Icon size={15} />
                      <span>{cue.label}</span>
                      <small>{cue.detail}</small>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>

          <section className="room-preview">
            <section className="panel milestone-story-card">
              <div>
                <span className="room-kicker">Milestone story</span>
                <h2>{selectedMilestone ? `You are making: ${selectedMilestone.title}` : "Pick a small step"}</h2>
                <p>{selectedMilestone ? grade3Copy(selectedMilestone.visibleOutput) : "Choose one project step to begin."}</p>
              </div>
              <div className="before-after-grid">
                <div>
                  <strong>Before</strong>
                  <p>{beforeAfter.before}</p>
                </div>
                <ArrowRight size={18} />
                <div>
                  <strong>After</strong>
                  <p>{beforeAfter.after}</p>
                </div>
              </div>
            </section>

            {activeScaffoldStep === "checklist" && renderChecklistWorkshop()}
            {(activeScaffoldStep === "logic" || activeScaffoldStep === "build") && renderCenterLogicMap()}

            <div className="panel preview-panel room-preview-panel">
              <div className="panel-header">
                <div>
                  <h2>Preview</h2>
                  <span className={`run-status ${previewState.status}`}>{previewState.status}</span>
                </div>
                <div className="preview-device-tabs">
                  <button className="active" type="button">
                    <Eye size={16} />
                  </button>
                  <button type="button" disabled>
                    <Layers3 size={16} />
                  </button>
                </div>
              </div>
              <div className="preview-surface">
                <P5Preview code={code} runKey={runKey} onConsole={handleConsole} onError={handlePreviewError} />
              </div>
              <div className="preview-actions-row">
                <span>{previewState.error ? previewState.error : `${previewState.runCount} run(s), ${previewState.console.length} message(s)`}</span>
                <button className="secondary-button compact" type="button" onClick={handleRunPreview} disabled={isBusy}>
                  <Play size={15} />
                  Run
                </button>
                <button className="secondary-button compact" type="button" onClick={() => setRunKey((key) => key + 1)}>
                  <RefreshCcw size={15} />
                  Restart
                </button>
              </div>
            </div>

            <section className="panel observe-panel">
              <div className="panel-header">
                <h2>Expected vs observed</h2>
                <button className="mini-button" type="button" onClick={() => setActiveStage("preview")}>
                  Debug view
                </button>
              </div>
              <div className="observation-strip">
                <div>
                  <strong>Expected</strong>
                  <p>{grade3Copy(firstUncheckedChecklistItem || selectedMilestone?.visibleOutput || "This step works in the preview.")}</p>
                </div>
                <div>
                  <strong>Observed</strong>
                  <textarea value={debugSymptom} onChange={(event) => setDebugSymptom(event.target.value)} aria-label="Observed behavior" />
                </div>
              </div>
            </section>

            <section className="panel system-map-panel">
              <div className="panel-header">
                <h2>System map update</h2>
                <span className="muted">How this step connects</span>
              </div>
              <div className="system-card-row">
                {currentSystemCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div className={`system-card ${card.kind}`} key={card.title}>
                      <Icon size={17} />
                      <strong>{card.title}</strong>
                      <p>{card.detail}</p>
                      {index < currentSystemCards.length - 1 && <ArrowRight className="system-arrow" size={16} />}
                    </div>
                  );
                })}
              </div>
            </section>

            {renderToolDrawer()}
          </section>

          <aside className="scaffold-panel">
            <section className="panel scaffold-card">
              <div className="card-title">
                <Sparkles size={18} />
                <h2>Scaffold panel</h2>
              </div>

              <div className="scaffold-steps">
                {scaffoldSteps.map((step) => {
                  const isActive = activeScaffoldStep === step.id;
                  return (
                    <section className={`scaffold-step ${isActive ? "active" : ""}`} key={step.id}>
                      <button type="button" onClick={() => setActiveScaffoldStep(step.id)}>
                        <span>{scaffoldSteps.findIndex((item) => item.id === step.id) + 1}</span>
                        <div>
                          <strong>{step.title}</strong>
                          <small>{step.hint}</small>
                        </div>
                      </button>

                      {isActive && step.id === "story" && (
                        <div className="scaffold-body">
                          <p>{selectedMilestone ? `Next, make only this happen: ${grade3Copy(selectedMilestone.visibleOutput)}` : "Pick a step from the project map."}</p>
                          <button className="secondary-button compact" type="button" onClick={() => setActiveScaffoldStep("checklist")} disabled={!selectedMilestone}>
                            Write checklist <ArrowRight size={14} />
                          </button>
                        </div>
                      )}

                      {isActive && step.id === "checklist" && (
                        <div className="scaffold-body">
                          <strong>What should happen when this step is done?</strong>
                          <p>Write 2-4 things you can see or test.</p>
                          <div className="starter-chips">
                            {sentenceStarters.map((starter) => (
                              <button
                                type="button"
                                key={starter}
                                onClick={() =>
                                  selectedMilestone &&
                                  setDraftChecklists((items) => ({
                                    ...items,
                                    [selectedMilestone.id]: `${draftChecklist}${draftChecklist ? "\n" : ""}${starter}`
                                  }))
                                }
                              >
                                {starter}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={draftChecklist}
                            placeholder={"I can click an answer.\nThe game says Correct if the answer is right."}
                            onChange={(event) =>
                              selectedMilestone &&
                              setDraftChecklists((items) => ({
                                ...items,
                                [selectedMilestone.id]: event.target.value
                              }))
                            }
                            aria-label="Student checklist draft"
                          />
                          <button className="primary-button compact" type="button" onClick={handleReviewChecklist} disabled={!selectedMilestone || !draftChecklist.trim() || isBusy}>
                            <Sparkles size={15} />
                            Ask AI for feedback
                          </button>

                          {checklistFeedback && (
                            <div className="checklist-feedback">
                              {checklistFeedback.goodAndCheckable.length > 0 && (
                                <div className="feedback-group good">
                                  <strong>Good and checkable</strong>
                                  {checklistFeedback.goodAndCheckable.map((item) => (
                                    <p key={item.text}>{item.text}</p>
                                  ))}
                                </div>
                              )}
                              {checklistFeedback.tooVague.length > 0 && (
                                <div className="feedback-group vague">
                                  <strong>Too vague</strong>
                                  {checklistFeedback.tooVague.map((item) => (
                                    <p key={item.text}>{item.text}: {item.reason}</p>
                                  ))}
                                </div>
                              )}
                              {checklistFeedback.missingStep.length > 0 && (
                                <div className="feedback-group missing">
                                  <strong>Missing step</strong>
                                  {checklistFeedback.missingStep.map((item) => (
                                    <p key={item.text}>{item.text}</p>
                                  ))}
                                </div>
                              )}
                              <div className="clearer-checklist">
                                <strong>Clearer checklist</strong>
                                {checklistFeedback.improvedChecklist.map((item) => (
                                  <span key={item}>□ {grade3Copy(item)}</span>
                                ))}
                              </div>
                              <div className="button-row">
                                <button className="primary-button compact" type="button" onClick={() => handleConfirmChecklist(true)} disabled={isBusy}>
                                  Use this checklist
                                </button>
                                <button className="secondary-button compact" type="button" onClick={() => handleConfirmChecklist(false)} disabled={isBusy}>
                                  Use mine
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isActive && step.id === "logic" && (
                        <div className="scaffold-body">
                          {!milestonePlan ? (
                            <>
                              <p>Confirm your checklist first, then AI will make a small logic map.</p>
                              <button className="secondary-button compact" type="button" onClick={handlePlanMilestone} disabled={!currentChecklist.length || isBusy}>
                                Create logic map
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="logic-sketch">
                                {milestonePlan.logicSketch.map((logicStep, index) => (
                                  <div className="logic-step" key={`${logicStep}-${index}`}>
                                    <span>{index + 1}</span>
                                    <p>{grade3Copy(logicStep)}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="question-block">
                                <strong>{milestonePlan.predictionQuestion.prompt}</strong>
                                <div className="option-list">
                                  {milestonePlan.predictionQuestion.options.map((option, index) => (
                                    <button
                                      className={`choice-button ${predictionAnswer === index ? "selected" : ""}`}
                                      key={option}
                                      type="button"
                                      onClick={() => setPredictionAnswer(index)}
                                    >
                                      {grade3Copy(option)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <button className="secondary-button compact" type="button" onClick={() => setActiveScaffoldStep("build")}>
                                Build next <ArrowRight size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {isActive && step.id === "build" && (
                        <div className="scaffold-body">
                          <p>AI will make one small change for this checklist only.</p>
                          <button className="primary-button" type="button" onClick={handleApplyPatch} disabled={isBusy || !canBuild}>
                            <Wand2 size={16} />
                            Make this change
                          </button>
                          {predictionAnswer === null && <small>Answer the quick logic question first.</small>}
                        </div>
                      )}

                      {isActive && step.id === "preview" && (
                        <div className="scaffold-body">
                          <div className="panel-header">
                            <strong>Did this happen?</strong>
                            <span>{completedChecklistCount} / {currentChecklist.length || 0}</span>
                          </div>
                          {currentChecklist.length === 0 ? (
                            <p>Confirm your checklist before checking the preview.</p>
                          ) : (
                            <div className="checklist-monitor">
                              {currentChecklist.map((item) => (
                                <div className="monitor-row" key={item}>
                                  <p>{grade3Copy(item)}</p>
                                  <div>
                                    {(["yes", "not_yet", "unsure"] as ChecklistCheckStatus[]).map((status) => (
                                      <button
                                        className={currentChecklistChecks[item] === status ? "selected" : ""}
                                        type="button"
                                        key={status}
                                        onClick={() => handleChecklistStatus(item, status)}
                                      >
                                        {status === "yes" ? "Yes" : status === "not_yet" ? "Not yet" : "Not sure"}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="button-row">
                            <button className="secondary-button compact" type="button" onClick={handleDiagnoseDebug} disabled={!selectedMilestone || isBusy}>
                              <Bug size={15} />
                              Ask AI about what I saw
                            </button>
                            <button className="primary-button compact" type="button" disabled={!allChecklistDone} onClick={handleCompleteMilestone}>
                              <Check size={15} />
                              This step works
                            </button>
                          </div>
                        </div>
                      )}

                      {isActive && step.id === "explain" && (
                        <div className="scaffold-body">
                          {miniExplain ? (
                            <>
                              <strong>{miniExplain.prompt}</strong>
                              <div className="option-list">
                                {miniExplain.options.map((option, index) => (
                                  <button
                                    className={`choice-button ${miniExplainAnswer === index ? "selected" : ""}`}
                                    key={option}
                                    type="button"
                                    onClick={() => handleMiniExplainAnswer(index)}
                                  >
                                    {grade3Copy(option)}
                                  </button>
                                ))}
                              </div>
                              <button className="secondary-button compact" type="button" onClick={handleSelectNextMilestone} disabled={miniExplainAnswer === null && !currentStepIsDone}>
                                Next small step <ArrowRight size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <p>After you build and check the preview, AI will ask one tiny why question.</p>
                              <button className="secondary-button compact" type="button" onClick={handleSelectNextMilestone} disabled={!currentStepIsDone || !nextMilestone}>
                                Choose next step
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </section>

            <section className="panel ai-support">
              <h2>Ask for help</h2>
              <p>Use this when what you see does not match your checklist.</p>
              <button className="secondary-button" type="button" onClick={() => setActiveStage("preview")} disabled={!project}>
                <Bug size={16} />
                Open debug room
              </button>
              <button className="secondary-button" type="button" onClick={handleSelectNextMilestone} disabled={!currentStepIsDone || !nextMilestone}>
                <ArrowRight size={16} />
                Pick next step
              </button>
            </section>
          </aside>
        </div>
      </section>
    );
  }

  function renderPreviewDebug() {
    return (
      <section className="stage-view debug-stage">
        <div className="project-topline">
          <button type="button" className="back-button" onClick={() => setActiveStage("milestones")}>
            <ArrowLeft size={17} />
            Back to project
          </button>
          <div className="project-title-block">
            <span className="project-avatar">
              <Gamepad2 size={24} />
            </span>
            <div>
              <h1>{projectTitle}</h1>
              <p>Look at your project, pick what is missing, and fix one thing.</p>
            </div>
            <em>Debugging & Improving</em>
          </div>
          <button className="secondary-button compact" type="button" onClick={() => setActiveStage("milestones")}>
            Open project <ArrowRight size={15} />
          </button>
        </div>

        <div className="debug-grid">
          <section className="panel debug-project-map-panel">
            <div className="panel-header">
              <h2>
                <Map size={20} />
                Project Map
              </h2>
              <CircleHelp size={16} />
            </div>
            <div className="debug-map-list">
              {milestones.map((milestone) => (
                <button
                  className={`debug-map-item ${milestone.id === selectedMilestoneId ? "active" : ""} ${milestone.status}`}
                  type="button"
                  key={milestone.id}
                  onClick={() => handleSelectMilestone(milestone)}
                >
                  <span>{milestone.status === "done" ? <Check size={16} /> : milestone.order}</span>
                  <div>
                    <strong>{milestone.title}</strong>
                    <p>{grade3Copy(milestone.visibleOutput)}</p>
                  </div>
                  <ChevronDown size={16} />
                </button>
              ))}
            </div>
          </section>

          <section className="debug-main-stack">
            <section className="panel debug-preview-panel">
              <div className="panel-header">
                <h2>Live preview after fix</h2>
                <span className={`run-status ${previewState.status}`}>{previewState.status}</span>
              </div>
              <div className="preview-surface debug-preview-surface">
                <P5Preview code={code} runKey={runKey} onConsole={handleConsole} onError={handlePreviewError} />
              </div>
              <p className="muted">Try clicking the preview, then choose what is missing.</p>
            </section>

            <section className="panel expected-card">
              <div className="card-title">
                <Check size={18} />
                <h2>Should see vs I see</h2>
              </div>
              <div className="comparison-grid">
                <div className="expected-box">
                  <strong>Should see</strong>
                  <p>{grade3Copy(failedChecklistItem || firstUncheckedChecklistItem || "This step works in the preview.")}</p>
                </div>
                <span className="vs-chip">vs</span>
                <div className="observed-box">
                  <strong>I see</strong>
                  <textarea value={debugSymptom} onChange={(event) => setDebugSymptom(event.target.value)} aria-label="Observed preview behavior" />
                </div>
              </div>
            </section>

            <section className="panel failed-check-card">
              <div className="card-title">
                <ListChecks size={18} />
                <h2>What is missing?</h2>
              </div>
              <div className="failed-list">
                {currentChecklist.length === 0 ? (
                  <p className="muted">Plan a step first, then pick what is missing.</p>
                ) : (
                  currentChecklist.map((item) => (
                    <label className={failedChecklistItem === item ? "selected" : ""} key={item}>
                      <input
                        type="radio"
                        name="failed-check"
                        checked={failedChecklistItem === item}
                        onChange={() => {
                          setFailedChecklistItem(item);
                          setDebugSymptom(`I do not see this yet: ${grade3Copy(item)}`);
                        }}
                      />
                      <span>{grade3Copy(item)}</span>
                    </label>
                  ))
                )}
              </div>
              <button className="primary-button compact" type="button" onClick={handleDiagnoseDebug} disabled={!selectedMilestone || isBusy}>
                <Bug size={16} />
                Help me fix it
              </button>
            </section>

            <div className="debug-card-row">
              <section className="panel fix-card">
                <div className="card-title">
                  <Wand2 size={18} />
                  <h2>Small fix to try</h2>
                </div>
                {debugDiagnosis ? (
                  <>
                    <small>AI idea · updated just now</small>
                    <p>{debugDiagnosis.fixSummary}</p>
                    <div className="debug-choice-list">
                      {debugDiagnosis.choices.map((choice) => (
                        <button className={`choice-button ${choice.isLikely ? "selected" : ""}`} type="button" key={choice.label}>
                          {choice.label}
                        </button>
                      ))}
                    </div>
                    <button className="secondary-button compact" type="button" onClick={handleApplyPatch} disabled={isBusy || !selectedMilestone}>
                      <Sparkles size={15} />
                      Try this fix
                    </button>
                  </>
                ) : (
                  <p>Pick what is missing, then ask for one small fix.</p>
                )}
              </section>

              <section className="panel mini-explain-card">
                <div className="card-title">
                  <Sparkles size={18} />
                  <h2>Quick why</h2>
                </div>
                <p>
                  <strong>What is happening?</strong>
                  <br />
                  The project needs a small rule so the next thing appears.
                </p>
                <p>
                  <strong>Why this helps</strong>
                  <br />
                  You can fix your project by checking what you can see.
                </p>
                <span>Idea: what appears on screen</span>
              </section>
            </div>
          </section>

          <aside className="debug-side">
            <section className="panel system-update-card">
              <div className="card-title">
                <Workflow size={18} />
                <h2>System map update</h2>
              </div>
              <p>Your game's system has grown.</p>
              <div className="system-update-list">
                {currentSystemCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <article key={card.title}>
                      <Icon size={18} />
                      <div>
                        <strong>{index + 1}. {card.title}</strong>
                        <p>{card.detail}</p>
                      </div>
                      {index === currentSystemCards.length - 1 && <em>New</em>}
                    </article>
                  );
                })}
              </div>
              <strong className="system-celebration">Great! Your system is clearer now.</strong>
            </section>
            <section className="panel next-card">
              {currentStepIsDone ? (
                <>
                  <div className="card-title">
                    <Flag size={18} />
                    <h2>Choose next step</h2>
                  </div>
                  <p>This step is done. Pick what to build next.</p>
                  {(milestones.length ? milestones.filter((milestone) => milestone.order > (selectedMilestone?.order ?? 0)).slice(0, 4) : []).map((milestone) => (
                    <button className="next-option" type="button" key={milestone.id} onClick={() => handleSelectMilestone(milestone)}>
                      <span>
                        <Check size={18} />
                      </span>
                      <div>
                        <strong>{milestone.title}</strong>
                        <p>{grade3Copy(milestone.visibleOutput)}</p>
                      </div>
                    </button>
                  ))}
                  <button className="link-button" type="button" onClick={() => setActiveStage("flowchart")}>
                    Not sure? Ask AI for a suggestion <ArrowRight size={15} />
                  </button>
                </>
              ) : (
                <>
                  <div className="card-title">
                    <ListChecks size={18} />
                    <h2>Finish this step first</h2>
                  </div>
                  <p>Fix the missing checklist item before choosing another step.</p>
                  <div className="mini-checklist">
                    {currentChecklist.slice(0, 4).map((item) => (
                      <span key={item} className={currentChecklistChecks[item] === "yes" ? "done" : ""}>
                        {currentChecklistChecks[item] === "yes" ? <Check size={14} /> : <CircleHelp size={14} />}
                        {grade3Copy(item)}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </section>
            <section className="mentor-card">
              <Headphones size={24} />
              <h2>Mentor Support</h2>
              <p>Need a second opinion or stuck on something?</p>
              <button type="button" className="secondary-button">
                Ask a mentor
              </button>
              <small>Live help times Mon-Fri, 2-6 PM ET</small>
            </section>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <main className={`studio-shell stage-${activeStage}`}>
      <header className="studio-appbar">
        <div className="studio-brand-row">
          <button className="studio-brand" type="button" onClick={() => setActiveStage(project ? "milestones" : "dashboard")}>
            <span className="studio-brand-mark">G</span>
            <strong>Goal-to-Milestone</strong>
          </button>
          <span className="appbar-divider" />
          <button className="project-switcher" type="button" onClick={() => project ? setActiveStage("milestones") : setActiveStage("dashboard")}>
            <Folder size={20} />
            {projectTitle}
            <ChevronDown size={16} />
          </button>
        </div>

        <div className="studio-stage-chips" aria-label="Project stages">
          {[
            { stage: "dashboard" as const, label: "Idea", icon: Lightbulb },
            { stage: "flowchart" as const, label: "Flowchart", icon: Workflow },
            { stage: "milestones" as const, label: "Milestone", icon: Flag },
            { stage: "preview" as const, label: "Preview", icon: Eye }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeStage === item.stage ? "active" : ""}
                type="button"
                key={item.label}
                onClick={() => openStage(item.stage)}
                disabled={!canOpenStage(item.stage)}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="studio-actions">
          <span className="saved-status">
            <CheckCircle2 size={16} />
            Saved just now
          </span>
          <button className="studio-action-button" type="button" onClick={() => appendAssistantLog("Saved locally for this prototype.")}>
            <Save size={18} />
            Save
          </button>
          <button className="studio-action-button" type="button" disabled>
            <User size={18} />
            Share
          </button>
          <button className="studio-action-button" type="button" onClick={() => setDrawerOpen((open) => !open)}>
            <MoreHorizontal size={18} />
            More
          </button>
          <button className="studio-action-button compact-icon" type="button" title="New goal" onClick={handleResetWorkspace}>
            <RefreshCcw size={17} />
          </button>
          <button className="studio-action-button compact-icon" type="button" title="Roll back to latest checkpoint" onClick={() => activeCheckpoint && handleRollback(activeCheckpoint)} disabled={!activeCheckpoint}>
            <RotateCcw size={17} />
          </button>
        </div>
      </header>

      <section className="studio-main">
        {activeStage === "dashboard" && renderDashboard()}
        {activeStage === "flowchart" && renderFlowchart()}
        {activeStage === "milestones" && renderMilestones()}
        {activeStage === "preview" && renderPreviewDebug()}
        {error && <p className="floating-error">{error}</p>}
      </section>
    </main>
  );
}
