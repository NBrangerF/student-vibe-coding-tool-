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
  Cloud,
  Database,
  Download,
  Eye,
  ExternalLink,
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
  Monitor,
  MoreHorizontal,
  MousePointerClick,
  Paintbrush,
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
  Trash2,
  Trophy,
  User,
  Wand2,
  Workflow,
  X
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
type TrailItemStatus = Milestone["status"] | "upcoming" | "open" | "known";
type TrailItem = {
  id: string;
  order: number;
  title: string;
  detail: string;
  status: TrailItemStatus;
  icon: typeof Gamepad2;
};

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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeStage, activeScaffoldStep]);

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
    if (!selectedMilestone) return;
    const draftForReview = draftChecklist.trim() || selectedMilestone.doneChecklist.slice(0, 4).join("\n");
    if (!draftForReview.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      if (!draftChecklist.trim()) {
        setDraftChecklists((items) => ({ ...items, [selectedMilestone.id]: draftForReview }));
      }
      const feedback = await postJson<ChecklistFeedbackResponse>("/api/checklist/review", {
        milestone: selectedMilestone,
        draftChecklist: draftForReview
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
    const fallbackItems = parseChecklistText(draftChecklist).length ? parseChecklistText(draftChecklist) : selectedMilestone.doneChecklist.slice(0, 4);
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
    setActiveStage("preview");
    appendAssistantLog("Step marked done. Look at what changed in your system, then choose the next small step.");
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

  function milestoneIconForOrder(order?: number) {
    if (order === 1) return Play;
    if (order === 2) return CircleHelp;
    if (order === 3) return MessageCircle;
    if (order === 4) return Trophy;
    if (order === 5) return ListChecks;
    return Workflow;
  }

  function trailItems(): TrailItem[] {
    if (milestones.length) {
      return milestones.map((milestone) => ({
        id: milestone.id,
        order: milestone.order,
        title: milestone.title,
        detail: grade3Copy(milestone.visibleOutput),
        status: milestone.status,
        icon: milestoneIconForOrder(milestone.order)
      }));
    }

    const fallback = [
      { title: "Start screen", detail: "Create the welcome or start screen." },
      { title: "One question", detail: "Add a question and multiple choices." },
      { title: "Answer feedback", detail: "Show feedback when a player answers." },
      { title: "Score", detail: "Keep track of correct answers." },
      { title: "More questions", detail: "Add new questions to keep the game going." }
    ];

    return fallback.map((item, index) => ({
      id: `trail-${index + 1}`,
      order: index + 1,
      title: item.title,
      detail: item.detail,
      status: index < Math.max(1, pathMap?.confidence ? Math.round(pathMap.confidence * 3) : 1) ? "known" : "open",
      icon: milestoneIconForOrder(index + 1)
    }));
  }

  function currentFocusLabel() {
    if (activeStage === "preview" && !currentStepIsDone) return "Mismatch Lens";
    if (activeStage === "preview" && currentStepIsDone) return "Feedback";
    if (activeScaffoldStep === "logic" || activeScaffoldStep === "build" || activeScaffoldStep === "preview") return "Logic + Preview";
    return selectedMilestone?.title ?? "Feedback";
  }

  function renderProjectSideCard(options?: { updated?: boolean }) {
    const progress = selectedMilestone?.order ?? Math.min(3, Math.max(1, trailItems().filter((item) => item.status === "done" || item.status === "known").length));

    return (
      <aside className="system-project-card">
        <span className="project-orb">
          <Gamepad2 size={38} />
        </span>
        <div className="project-name-row">
          <h2>{projectTitle}</h2>
          <Pencil size={18} />
        </div>
        <p>A quiz game about my school.</p>
        <hr />
        <span className="project-field-label">Current focus</span>
        <div className="focus-chip">
          <span />
          {currentFocusLabel()}
        </div>
        <div className="progress-row">
          <span>Progress</span>
          <strong>{progress} of 5</strong>
        </div>
        <div className="project-progress-bar">
          <i style={{ width: `${Math.min(100, (progress / 5) * 100)}%` }} />
        </div>
        <hr />
        <div className="project-date-row">
          <CalendarIcon />
          {options?.updated ? "Updated just now" : "Created today"}
        </div>
      </aside>
    );
  }

  function CalendarIcon() {
    return (
      <span aria-hidden="true" className="calendar-glyph">
        □
      </span>
    );
  }

  function renderQuietAiCard(message: string, detail?: string, action?: { label: string; onClick: () => void }) {
    return (
      <section className="quiet-ai-card">
        <span>
          <Sparkles size={24} />
        </span>
        <div>
          <small>Quiet AI</small>
          <strong>{message}</strong>
          {detail && <p>{detail}</p>}
          {action && (
            <button className="secondary-button compact" type="button" onClick={action.onClick}>
              {action.label}
            </button>
          )}
        </div>
      </section>
    );
  }

  function renderTrailLegend() {
    return (
      <div className="trail-legend" aria-label="Build trail legend">
        <span>
          <Check size={16} />
          Completed
        </span>
        <span>
          <i />
          Current focus
        </span>
        <span>
          <b />
          Upcoming
        </span>
      </div>
    );
  }

  function renderNextBuildPanel(mode: "choose" | "logic" | "debug" | "growth" = "choose") {
    const future = milestones.length
      ? milestones.filter((milestone) => milestone.order > (selectedMilestone?.order ?? 0)).slice(0, 3)
      : [];
    const defaultOptions = [
      { title: "First screen", detail: "Create the welcome or start screen.", icon: Play, tone: "teal" },
      { title: "One question", detail: "Add a question and multiple choices.", icon: CircleHelp, tone: "blue" },
      { title: "Answer feedback", detail: "Show feedback when a player answers.", icon: MessageCircle, tone: "amber" }
    ];
    const options: Array<{ title: string; detail: string; icon: typeof Play; tone: string; milestone?: Milestone }> = future.length
      ? future.map((milestone) => ({ title: milestone.title, detail: grade3Copy(milestone.visibleOutput), icon: milestoneIconForOrder(milestone.order), tone: milestone.order === 4 ? "blue" : "amber", milestone }))
      : defaultOptions.map((item) => ({ ...item, milestone: undefined }));

    return (
      <aside className={`next-build-panel ${mode}`}>
        <h2>Choose your next build step</h2>
        <p>{mode === "logic" ? "You're building great. Here is what comes next." : "Pick a starting point. You can change it anytime."}</p>
        <div className="next-build-list">
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <button
                className={`next-build-option ${option.tone} ${index === 0 ? "active" : ""}`}
                type="button"
                key={option.title}
                onClick={() => option.milestone ? handleSelectMilestone(option.milestone) : undefined}
              >
                <Icon size={30} />
                <div>
                  <strong>{option.title}</strong>
                  <span>{option.detail}</span>
                </div>
                <ArrowRight size={22} />
              </button>
            );
          })}
          {mode === "growth" && (
            <button className="next-build-option amber" type="button">
              <Paintbrush size={30} />
              <div>
                <strong>Style the game</strong>
                <span>Pick colors, fonts, and make it yours.</span>
              </div>
              <ArrowRight size={22} />
            </button>
          )}
        </div>
      </aside>
    );
  }

  function renderDashboard() {
    const canMakeMap = Boolean(goalInterview?.readiness.canGeneratePath);
    const ideaCtaLabel = canMakeMap ? "Make my system trail" : goalInterview ? "Continue in System Trail" : "Start my system trail";
    const seedTrail = [
      { title: "Goal", detail: "Your idea", icon: Target },
      { title: "First view", detail: "What players see", icon: Play },
      { title: "Action", detail: "What players do", icon: MousePointerClick },
      { title: "Feedback", detail: "What changes", icon: MessageCircle }
    ];

    return (
      <section className="idea-seed-screen">
        <aside className="idea-side-rail">
          <span className="project-orb">
            <Gamepad2 size={38} />
          </span>
          <h2>School Quiz Game</h2>
          <p>A quiz game about my school.</p>
          <div className="seed-status-card">
            <small>Current focus</small>
            <strong>
              <Target size={18} />
              Idea seed
            </strong>
          </div>
          <div className="seed-helper-stack">
            <strong>Quick starters</strong>
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
                </button>
              );
            })}
          </div>
        </aside>

        <section className="idea-seed-stage">
          <div className="idea-seed-title">
            <span className="step-pill">Step 1 of 5</span>
            <h1>
              <Sparkles size={30} />
              Idea Seed Studio
            </h1>
            <p>Start with what you want to make happen. The system trail grows from your answers.</p>
          </div>

          <section className="idea-seed-hero">
            <div className="seed-orbit" aria-hidden="true">
              <span className="seed-ring one" />
              <span className="seed-ring two" />
              <span className="seed-dot dot-one" />
              <span className="seed-dot dot-two" />
              <span className="seed-dot dot-three" />
              <Target size={78} />
            </div>
            <label className="idea-seed-input">
              <span>What do you want to make happen?</span>
              <textarea maxLength={500} value={idea} onChange={(event) => setIdea(event.target.value)} aria-label="Project idea" />
              <small>
                <CheckCircle2 size={16} />
                Clear enough to start asking.
              </small>
            </label>
            <div className="seed-player-preview">
              <strong>Players might...</strong>
              <span><Play size={17} /> open a start screen</span>
              <span><CircleHelp size={17} /> answer one school question</span>
              <span><MessageCircle size={17} /> see helpful feedback</span>
            </div>
          </section>

          <section className="seed-trail-preview" aria-label="System trail preview">
            {seedTrail.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className={index === 0 ? "active" : ""}>
                  <span>{index + 1}</span>
                  <Icon size={26} />
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="starter-strip seed-starters" aria-label="Example project starters">
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

        <aside className="idea-clarify-rail">
          <div>
            <span className="quiet-mark">
              <Wand2 size={22} />
            </span>
            <h2>Shape the first trail</h2>
            <p>Pick what feels right. Nothing is built yet.</p>
          </div>

          {[
            {
              question: "What should players see first?",
              options: ["Title screen", "First question", "How to play"],
              icon: Play
            },
            {
              question: "What should they do next?",
              options: ["Choose an answer", "Pick a topic", "Read a clue"],
              icon: MousePointerClick
            },
            {
              question: "What should change after that?",
              options: ["Show feedback", "Add score", "Next question"],
              icon: MessageCircle
            }
          ].map((prompt, promptIndex) => {
            const Icon = prompt.icon;
            return (
              <article className="seed-question" key={prompt.question}>
                <div>
                  <span>{promptIndex + 1}</span>
                  <strong>{prompt.question}</strong>
                </div>
                <div>
                  {prompt.options.map((option, optionIndex) => (
                    <button
                      className={optionIndex === 0 ? "selected" : ""}
                      type="button"
                      key={option}
                      onClick={() => setIdea(`${DEFAULT_IDEA} ${option}.`)}
                    >
                      {option}
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
            className="primary-button seed-map-cta"
            type="button"
            onClick={canMakeMap ? handleGeneratePath : goalInterview ? () => setActiveStage("flowchart") : handleStartGoalInterview}
            disabled={isBusy || !idea.trim()}
          >
            <Map size={19} />
            {ideaCtaLabel}
            <ArrowRight size={19} />
          </button>
          <small>
            <LockIcon />
            No code yet. First we make the trail visible.
          </small>
        </aside>
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
    const trail = trailItems();
    const activeOrder = selectedMilestone?.order ?? 3;
    const activeTrail = trail.find((item) => item.order === activeOrder) ?? trail[2] ?? trail[0];

    return (
      <section className="system-trail-screen">
        {renderProjectSideCard()}

        <section className="system-trail-canvas">
          <div className="trail-heading">
            <div>
              <h1>System Trail Canvas</h1>
              <p>Your build trail, one step at a time.</p>
            </div>
          </div>

          <div className="trail-canvas-field">
            <span className="trail-rail rail-one" />
            <span className="trail-rail rail-two" />
            <span className="trail-rail rail-three" />
            {trail.map((item) => {
              const Icon = item.icon;
              const isCompleted = item.status === "done" || item.status === "known";
              const isCurrent = item.order === activeOrder || item.status === "in_progress";
              return (
                <button
                  type="button"
                  className={`system-tile tile-${item.order} ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                  key={item.id}
                  onClick={() => {
                    const milestone = milestones.find((candidate) => candidate.order === item.order);
                    if (milestone) handleSelectMilestone(milestone);
                  }}
                >
                  {isCurrent && <span className="focus-pin" />}
                  <span className="tile-number">{item.order}</span>
                  <Icon size={42} />
                  <strong>{item.title}</strong>
                  <small>{isCompleted ? <Check size={18} /> : isCurrent ? "Current" : "Upcoming"}</small>
                </button>
              );
            })}

            {project && activeTrail && (
              <div className="trail-floating-ai">
                {renderQuietAiCard("This step may be too big.", "Want to split it?", {
                  label: "Review step",
                  onClick: () => setActiveScaffoldStep("story")
                })}
              </div>
            )}
          </div>

          {renderTrailLegend()}
        </section>

        {project && activeTrail ? (
          <aside className="selected-step-panel">
            <button className="panel-close" type="button" onClick={() => setActiveStage("milestones")}>
              <X size={20} />
            </button>
            <div className="selected-step-title">
              <span>{activeTrail.order}</span>
              <h2>{activeTrail.title}</h2>
            </div>
            <p>{activeTrail.detail}</p>
            <hr />
            <section>
              <span className="thought-icon">
                <Lightbulb size={22} />
              </span>
              <div>
                <h3>Why it matters</h3>
                <p>Feedback helps players learn and stay engaged. A clear explanation turns a simple answer into real understanding.</p>
              </div>
            </section>
            <hr />
            <h3>What this step includes</h3>
            <ul>
              <li>Check if the player's answer is correct</li>
              <li>Show correct answer and explanation</li>
              <li>Celebrate correct answers with feedback</li>
            </ul>
            <button className="trail-primary-action" type="button" onClick={() => setActiveStage("milestones")}>
              <Sparkles size={18} />
              Build this next
              <ArrowRight size={18} />
            </button>
            <button className="trail-secondary-action" type="button">
              <GitBranch size={18} />
              Split into smaller steps
            </button>
            <button className="trail-secondary-action quiet" type="button">
              <Sparkles size={18} />
              Ask AI why
            </button>
            <button className="trail-learn-link" type="button">
              Learn more about this step
              <ExternalLink size={15} />
            </button>
          </aside>
        ) : (
          <aside className="trail-question-panel">
            <h2>{goalInterview?.readiness.canGeneratePath ? "Choose your next build step" : "Build your trail"}</h2>
            <p>{goalInterview?.readiness.canGeneratePath ? "You have enough choices to create the first bounded milestone." : "Answer one question. The trail grows only when the idea is clearer."}</p>
            {!goalInterview ? (
              <>
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
              <p>Ready. Make the trail and choose the first small step.</p>
            )}
            <button className="primary-button" type="button" onClick={handleGeneratePath} disabled={isBusy || !canGeneratePath}>
              Make my system trail
              <ArrowRight size={16} />
            </button>
            {!canGeneratePath && goalInterview && <small>{Math.max(0, goalInterview.readiness.requiredCount - goalInterview.readiness.answeredCount)} more answer(s) before we build.</small>}
            {renderQuietAiCard("Small steps help your project grow.", "You're doing great. Keep building.")}
          </aside>
        )}
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

  function renderMilestoneGuide(activeIndex: number) {
    const guide = [
      ["Milestone story", "Why this step matters."],
      ["My checks", "Plan the checks."],
      ["See the logic", "How your checks work."],
      ["Build and try", "Put it together."],
      ["Check preview", "What will players see?"],
      ["What changed", "Your step summary."]
    ];

    return (
      <aside className="milestone-guide-panel">
        <h2>Milestone Room</h2>
        <p>{activeIndex <= 2 ? "Make your checklist." : activeIndex <= 4 ? "Build and test this step." : "Review your system growth."}</p>
        <div className="milestone-guide-list">
          {guide.map(([title, detail], index) => (
            <button
              className={activeIndex === index + 1 ? "active" : ""}
              type="button"
              key={title}
              onClick={() => {
                const nextStep: ScaffoldStep = index < 1 ? "story" : index === 1 ? "checklist" : index === 2 ? "logic" : index === 3 ? "build" : index === 4 ? "preview" : "explain";
                setActiveScaffoldStep(nextStep);
              }}
            >
              <span>{index + 1}</span>
              <div>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
            </button>
          ))}
        </div>
        <div className="guide-tip">
          <Lightbulb size={20} />
          <div>
            <strong>Tip</strong>
            <p>Good checks make clear steps your game can follow.</p>
          </div>
        </div>
      </aside>
    );
  }

  function renderChecksStage() {
    const beforeAfter = beforeAfterForMilestone(selectedMilestone);
    const draftItems = parseChecklistText(draftChecklist);
    const displayChecks = draftItems.length
      ? draftItems
      : currentChecklist.length
        ? currentChecklist
        : [
            "When the player clicks an answer, check if it is the right answer",
            "If the answer is correct, show Correct!",
            "If the answer is wrong, show Try again."
          ];

    function updateDraftItem(index: number, value: string) {
      if (!selectedMilestone) return;
      const next = [...displayChecks];
      next[index] = value;
      setDraftChecklists((items) => ({ ...items, [selectedMilestone.id]: next.join("\n") }));
    }

    return (
      <section className="milestone-focus-screen checks-screen">
        {renderProjectSideCard()}
        <section className="milestone-focus-main">
          <header className="focus-heading">
            <h1>This step: {selectedMilestone?.title ?? "Answer feedback"}</h1>
            <p>{selectedMilestone ? grade3Copy(selectedMilestone.visibleOutput) : "Let's plan what should happen in one small step."}</p>
          </header>

          <section className="before-after-hero">
            <div>
              <span>Before</span>
              <p>{beforeAfter.before}</p>
              <i className="ghost-action" />
            </div>
            <ArrowRight size={34} />
            <div>
              <span>After</span>
              <p>{beforeAfter.after}</p>
              {selectedMilestone?.order === 1 ? (
                <div className="feedback-sample title-sample">
                  <b><Play size={16} /> Start</b>
                </div>
              ) : (
                <div className="feedback-sample">
                  <b><Check size={16} /> Correct!</b>
                  <b className="try"><X size={16} /> Try again.</b>
                </div>
              )}
            </div>
          </section>

          <section className="my-checks-note">
            <div className="checks-note-header">
              <span>
                <Check size={26} />
              </span>
              <div>
                <h2>My checks</h2>
                <p>Write the checks your game needs to do in this step.</p>
              </div>
              <strong>{displayChecks.length} of {Math.max(3, displayChecks.length)}</strong>
            </div>
            <div className="checks-note-list">
              {displayChecks.map((item, index) => (
                <div className="check-note-row" key={`${item}-${index}`}>
                  <span className="drag-dots">⋮⋮</span>
                  <b>{index + 1}</b>
                  <input value={item} onChange={(event) => updateDraftItem(index, event.target.value)} aria-label={`My check ${index + 1}`} />
                  <button type="button" onClick={() => updateDraftItem(index, "")} aria-label="Clear check">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="checks-ai-row">
            {renderQuietAiCard(
              checklistFeedback ? checklistFeedback.assistantMessage : "Nice start. One check may be missing.",
              checklistFeedback ? "Choose whether to use the clearer checklist, edit it, or keep yours." : "What happens if the answer is wrong?",
              { label: checklistFeedback ? "Use suggestion" : "Show example", onClick: checklistFeedback ? () => handleConfirmChecklist(true) : handleReviewChecklist }
            )}
          </section>

          <div className="focus-action-row">
            <button
              className="secondary-button add-check-button"
              type="button"
              onClick={() =>
                selectedMilestone &&
                setDraftChecklists((items) => ({
                  ...items,
                  [selectedMilestone.id]: `${draftChecklist || displayChecks.join("\n")}\nI can see...`
                }))
              }
            >
              <Plus size={18} />
              Add this check
            </button>
            <button
              className="primary-button continue-button"
              type="button"
              disabled={isBusy || displayChecks.length < 2}
              onClick={() => {
                if (currentChecklist.length) {
                  setActiveScaffoldStep("logic");
                } else if (checklistFeedback) {
                  void handleConfirmChecklist(true);
                } else {
                  void handleReviewChecklist();
                }
              }}
            >
              Continue
              <ArrowRight size={22} />
            </button>
          </div>
        </section>
        {renderMilestoneGuide(2)}
      </section>
    );
  }

  function renderLogicPreviewStage() {
    const fallbackChain =
      !selectedMilestone || selectedMilestone.order <= 1
        ? [
            { kind: "goal", title: "Show title", detail: "Players can see what the game is.", icon: Target },
            { kind: "output", title: "Show Start", detail: "A clear button tells players how to begin.", icon: Play },
            { kind: "state", title: "Player knows the start", detail: "The first screen feels ready.", icon: User }
          ]
        : [
            { kind: "action", title: "Click answer", detail: "Player selects an answer option.", icon: MousePointerClick },
            { kind: "decision", title: "Check if right", detail: "Game checks if the answer is correct.", icon: Check },
            { kind: "feedback", title: "Show message", detail: "Display feedback for the player.", icon: MessageCircle },
            { kind: "state", title: "Player knows what happened", detail: "Player understands the result.", icon: User }
          ];
    const chain = currentSystemCards.length >= 3 ? currentSystemCards : fallbackChain;

    return (
      <section className="milestone-focus-screen logic-preview-screen">
        {renderProjectSideCard()}
        <section className="milestone-focus-main">
          <header className="focus-heading">
            <h1>Logic + Preview Stage</h1>
            <p>See how your game logic works and preview the experience.</p>
          </header>

          <section className="logic-chain-hero">
            <h2>Logic Chain</h2>
            <div className="logic-chain-row">
              {chain.slice(0, 4).map((card, index) => {
                const Icon = card.icon;
                return (
                  <article className={`logic-chain-card chain-${index + 1}`} key={card.title}>
                    <span>{index + 1}</span>
                    <Icon size={44} />
                    <strong>{card.title}</strong>
                    <p>{card.detail}</p>
                    {index < Math.min(4, chain.length) - 1 && <i />}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="preview-stage-card">
            <div className="preview-stage-main">
              <div className="preview-stage-title">
                <h2>Preview Stage</h2>
                <span>
                  <i />
                  Live preview
                </span>
              </div>
              <div className="preview-stage-frame">
                <P5Preview code={code} runKey={runKey} onConsole={handleConsole} onError={handlePreviewError} />
              </div>
            </div>
            <aside className="logic-checklist-card">
              <h3>Logic checklist</h3>
              {(currentChecklist.length ? currentChecklist : ["Answer selection", "Correctness check", "Feedback shown"]).slice(0, 4).map((item) => (
                <div key={item}>
                  <Check size={18} />
                  <span>
                    <strong>{grade3Copy(item)}</strong>
                    <small>Player can test this in the preview.</small>
                  </span>
                </div>
              ))}
              <button
                className="primary-button"
                type="button"
                disabled={isBusy || !currentChecklist.length}
                onClick={() => {
                  if (!milestonePlan) {
                    void handlePlanMilestone();
                  } else if (predictionAnswer === null) {
                    setPredictionAnswer(milestonePlan.predictionQuestion.correctIndex);
                  } else {
                    void handleApplyPatch();
                  }
                }}
              >
                <Play size={18} />
                Run and check
              </button>
            </aside>
          </section>

        </section>
        <aside className="logic-right-rail">
          {renderNextBuildPanel("logic")}
          {renderQuietAiCard("Here's the heart of your game.", "When a player clicks an answer, we check it, show feedback, and the player knows what happened.")}
        </aside>
      </section>
    );
  }

  function renderMismatchLens() {
    return (
      <section className="milestone-focus-screen mismatch-screen">
        {renderProjectSideCard()}
        <section className="milestone-focus-main">
          <header className="focus-heading">
            <h1>Mismatch Lens / Preview Debug</h1>
            <p>Compare what you expected vs. what actually happened.</p>
          </header>

          <section className="mismatch-lens-card">
            <div className="wanted-panel">
              <span><Check size={22} /></span>
              <h2>I wanted</h2>
              <p>When I click a correct answer, the game shows “Correct!”</p>
              <div className="wanted-visual">
                <strong>Correct!</strong>
                <small>Great job!</small>
                <Check size={28} />
              </div>
            </div>
            <div className="lens-icon">
              <Eye size={42} />
            </div>
            <div className="saw-panel">
              <span><Sparkles size={22} /></span>
              <h2>I saw</h2>
              <textarea value={debugSymptom} onChange={(event) => setDebugSymptom(event.target.value)} aria-label="Observed mismatch" />
              <div className="saw-visual">
                <strong>What is the capital of France?</strong>
                <span>Berlin</span>
                <span>Madrid</span>
                <span>Paris</span>
              </div>
            </div>
          </section>

          <section className="missing-check-card">
            <div>
              <span>!</span>
              <div>
                <h2>The missing check</h2>
                <p>{grade3Copy(failedChecklistItem || firstUncheckedChecklistItem || "The game needs to show feedback when the player selects a correct answer.")}</p>
              </div>
            </div>
            <div className="missing-step-chain">
              {["Is answer correct?", "Show “Correct!” message", "Add points", "Go to next question"].map((item, index) => (
                <button className={index === 1 ? "active" : ""} type="button" key={item}>
                  {index === 0 ? <Check size={16} /> : <span />}
                  {item}
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          </section>

          <section className="debug-preview-row">
            <div className="preview-stage-label">
              <Monitor size={24} />
              <h2>Preview stage</h2>
              <p>This is what your game looks like right now.</p>
            </div>
            <div className="debug-preview-frame">
              <P5Preview code={code} runKey={runKey} onConsole={handleConsole} onError={handlePreviewError} />
            </div>
            <aside className="try-fix-card">
              <Lightbulb size={22} />
              <h2>Try this fix</h2>
              <p>{debugDiagnosis?.fixSummary ?? "Add a message step that shows “Correct!” when the answer is right."}</p>
              <button className="primary-button" type="button" onClick={debugDiagnosis ? handleApplyPatch : handleDiagnoseDebug} disabled={isBusy || !selectedMilestone}>
                <Sparkles size={16} />
                Add message step
              </button>
              <button className="link-button" type="button">Show me how</button>
            </aside>
          </section>

        </section>
        <aside className="logic-right-rail">
          {renderNextBuildPanel("debug")}
          {renderQuietAiCard("The message step may be missing.", "Add feedback so players know they're correct.")}
        </aside>
      </section>
    );
  }

  function renderSystemGrowthMap() {
    const chain = [
      { title: "Player clicks answer", icon: MousePointerClick },
      { title: "Game checks answer", icon: ListChecks },
      { title: "Feedback appears", icon: MessageCircle },
      { title: "Player knows what happened", icon: User }
    ];

    return (
      <section className="milestone-focus-screen growth-screen">
        {renderProjectSideCard({ updated: true })}
        <section className="milestone-focus-main">
          <header className="focus-heading">
            <h1>System Growth Map / What changed?</h1>
            <p>Your system grew. This step added a feedback loop.</p>
          </header>

          <section className="growth-map-card">
            <span className="growth-loop-line" />
            {chain.map((item, index) => {
              const Icon = item.icon;
              return (
                <article className={`growth-node ${index === 2 ? "new" : ""}`} key={item.title}>
                  {index === 2 && <em>New</em>}
                  <span>{index + 1}</span>
                  <Icon size={44} />
                  <strong>{item.title}</strong>
                  {index < chain.length - 1 && <i />}
                  <Check size={22} />
                </article>
              );
            })}
          </section>

          <section className="growth-summary-card">
            <span>
              <Sparkles size={30} />
            </span>
            <div>
              <h2>Great work! Your system grew.</h2>
              <p>You added feedback so players always know what happened.</p>
            </div>
            <div className="mini-build-trail">
              <strong>Build trail</strong>
              {[1, 2, 3, 4, 5].map((step) => (
                <span className={step <= 3 ? "done" : ""} key={step}>
                  {step <= 3 ? <Check size={14} /> : null}
                  {step}
                </span>
              ))}
            </div>
          </section>
        </section>
        <aside className="logic-right-rail">
          {renderNextBuildPanel("growth")}
          {renderQuietAiCard("Small steps make big systems.", "You're building something amazing.")}
        </aside>
      </section>
    );
  }

  function renderMilestones() {
    if (activeScaffoldStep === "explain") return renderSystemGrowthMap();
    if (activeScaffoldStep === "logic" || activeScaffoldStep === "build" || activeScaffoldStep === "preview") {
      return renderLogicPreviewStage();
    }
    return renderChecksStage();
  }

  function renderPreviewDebug() {
    if (currentStepIsDone || activeScaffoldStep === "explain") {
      return renderSystemGrowthMap();
    }
    return renderMismatchLens();

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
                    <p>{debugDiagnosis?.fixSummary}</p>
                    <div className="debug-choice-list">
                      {(debugDiagnosis?.choices ?? []).map((choice) => (
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
            <span className="studio-brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <strong>Goal-to-Milestone</strong>
          </button>
          <span className="appbar-divider" />
          <div className="studio-breadcrumb">
            <button type="button" onClick={() => setActiveStage("dashboard")}>My Projects</button>
            <span>›</span>
            <button type="button" onClick={() => project ? setActiveStage("flowchart") : setActiveStage("dashboard")}>{projectTitle}</button>
            <Pencil size={18} />
            <small>
              <CheckCircle2 size={15} />
              All changes saved
            </small>
          </div>
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
            <Cloud size={18} />
            Saved just now
          </span>
          <span className="appbar-divider" />
          <button className="studio-action-button" type="button" onClick={() => appendAssistantLog("Help stays simple: pick one thing you want to understand.")}>
            <CircleHelp size={18} />
            Help
          </button>
          <span className="appbar-divider" />
          <button className="studio-avatar-button" type="button" aria-label="Learner menu">
            A
          </button>
          <button className="studio-action-button compact-icon" type="button" onClick={() => setDrawerOpen((open) => !open)} title="More">
            <ChevronDown size={18} />
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
