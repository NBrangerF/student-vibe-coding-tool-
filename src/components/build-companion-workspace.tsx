"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Cloud,
  Eye,
  Flag,
  Folder,
  Gamepad2,
  GitBranch,
  HeartPulse,
  Home,
  Layers3,
  Lightbulb,
  ListChecks,
  Map as MapIcon,
  MessageCircle,
  Monitor,
  MousePointerClick,
  PawPrint,
  Pencil,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Share2,
  Sparkles,
  Sprout,
  Star,
  Target,
  User,
  Wand2,
  Workflow,
  X
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { P5Preview } from "@/components/p5-preview";
import { postJson } from "@/lib/api-client";
import { languageLabel, translateUiText, UI_LANGUAGE_STORAGE_KEY, type UiLanguage } from "@/lib/i18n";
import { STARTER_CODE } from "@/lib/p5-code";
import {
  CandidateSystemPart,
  ChecklistFeedbackResponse,
  ChecklistItem,
  ChecklistStatus,
  Checkpoint,
  DebugDiagnosisResponse,
  DraftSystemTrail,
  DraftTrailResponse,
  ConfirmedTrailResponse,
  GoalUnderstanding,
  LogicChainStep,
  MilestonePlanResponse,
  PatchResponse,
  PlanningAnswerResponse,
  PlanningChoice,
  PlanningQuestion,
  PlanningSession,
  PlanningStartResponse,
  PlanningUnderstandingResponse,
  PreviewState,
  Project,
  SystemNode
} from "@/lib/types";

type StudioStage = "idea" | "understanding" | "coplan" | "draft" | "first" | "trail" | "room" | "preview" | "debug" | "growth";
type RoomStep = "story" | "checks" | "logic" | "build" | "preview" | "changed";

const STORAGE_KEY = "goal-to-milestone-co-planning-studio-v3";

const starterIdeas = [
  {
    title: "Pet Adventure Game",
    idea: "I want to make a pet adventure game.",
    detail: "A pet reacts to choices and unlocks a new scene.",
    icon: PawPrint
  },
  {
    title: "Club Task App",
    idea: "I want to make an app for my club tasks.",
    detail: "A club can add tasks, mark them done, and see progress.",
    icon: ListChecks
  },
  {
    title: "Story World Website",
    idea: "I want to make a story world website.",
    detail: "Readers choose places and see the story path change.",
    icon: Layers3
  },
  {
    title: "Habitat Simulation",
    idea: "I want to make a habitat simulation.",
    detail: "A habitat changes when living things need water or food.",
    icon: Sprout
  },
  {
    title: "School Quiz Game",
    idea: "I want to make a quiz game about my school.",
    detail: "A sample fixture with questions, feedback, and score.",
    icon: Gamepad2
  }
];

const sentenceStarters = ["I can...", "When I click...", "I see...", "The game says...", "The score..."];

const roomSteps: Array<{ id: RoomStep; label: string; detail: string; icon: typeof Flag }> = [
  { id: "story", label: "Milestone story", detail: "Why this part matters.", icon: Flag },
  { id: "checks", label: "My checks", detail: "Write what should happen.", icon: ListChecks },
  { id: "logic", label: "See the logic", detail: "How the system works.", icon: Workflow },
  { id: "build", label: "Build and try", detail: "Make one small change.", icon: Wand2 },
  { id: "preview", label: "Check preview", detail: "Test what you can see.", icon: Eye },
  { id: "changed", label: "What changed", detail: "Name how the system grew.", icon: Sparkles }
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
    .slice(0, 5);
}

function checklistItemsFromText(text: string, source: ChecklistItem["source"]): ChecklistItem[] {
  return parseChecklistText(text).map((item, index) => ({
    id: `check-${Date.now()}-${index}`,
    text: item,
    source,
    status: "unchecked"
  }));
}

function starterChecksForNode(node?: SystemNode): string {
  if (!node) return "";
  const text = `${node.title} ${node.visibleBehavior} ${node.systemRole}`.toLowerCase();
  if (/pet/.test(text)) return "I can see the pet.\nWhen I choose something, the pet reacts.\nI see what changed for the pet.";
  if (/task|list|done/.test(text)) return "I can see the task list.\nWhen I click a task, it changes.\nI see the list update.";
  if (/story|world|place|character/.test(text)) return "I can see the story world.\nWhen I choose a place, the story changes.\nI see what happens next.";
  if (/habitat|plant|animal|need|balance/.test(text)) return "I can see the habitat.\nWhen I change one part, the habitat responds.\nI see what changed in the system.";
  if (/score/.test(text)) return "I can see the score.\nThe score changes after the right answer.\nThe score stays on the screen.";
  if (/question|answer|feedback|correct/.test(text)) return "I can click an answer.\nThe project shows what happened.\nI see a message right away.";
  return `I can see ${node.title.toLowerCase()}.\nI can try one action.\nI see what changes.`;
}

function nodeIcon(node?: SystemNode) {
  const text = `${node?.title ?? ""} ${node?.systemRole ?? ""}`.toLowerCase();
  if (/pet/.test(text)) return PawPrint;
  if (/task|list/.test(text)) return ListChecks;
  if (/story|world|place/.test(text)) return Layers3;
  if (/habitat|plant/.test(text)) return Sprout;
  if (/score/.test(text)) return Star;
  if (/feedback|react|message/.test(text)) return MessageCircle;
  if (/question|answer|choice|input/.test(text)) return CircleHelp;
  if (/start|first|entry/.test(text)) return Play;
  return Workflow;
}

function currentNode(project: Project | null, selectedNodeId: string): SystemNode | undefined {
  if (!project) return undefined;
  return (
    project.systemTrail.nodes.find((node) => node.id === selectedNodeId) ??
    project.systemTrail.nodes.find((node) => node.id === project.currentFocusNodeId) ??
    project.systemTrail.nodes[0]
  );
}

function nextNodeAfter(project: Project | null, node?: SystemNode): SystemNode | undefined {
  if (!project || !node) return undefined;
  return project.systemTrail.nodes.find((candidate) => candidate.order > node.order && candidate.status !== "completed");
}

function updateNode(project: Project, nodeId: string, patch: Partial<SystemNode>): Project {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    systemTrail: {
      ...project.systemTrail,
      nodes: project.systemTrail.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node))
    }
  };
}

function setCurrentNode(project: Project, nodeId: string): Project {
  return {
    ...project,
    currentFocusNodeId: nodeId,
    status: "in_progress",
    updatedAt: new Date().toISOString(),
    systemTrail: {
      ...project.systemTrail,
      nodes: project.systemTrail.nodes.map((node) => {
        if (node.id === nodeId) return { ...node, status: node.status === "completed" ? "completed" : "current" };
        if (node.status === "current" || node.status === "building") return { ...node, status: "planned" };
        return node;
      })
    }
  };
}

function roleLabel(role: LogicChainStep["role"]): string {
  if (role === "user-action") return "User action";
  if (role === "system-change") return "System changes";
  if (role === "system-output") return "What appears";
  return "User understands";
}

function statusClass(node: SystemNode, selectedNodeId: string): string {
  const selected = node.id === selectedNodeId ? "selected" : "";
  return `${node.status} ${selected}`;
}

function planningPreviewNodes(session: PlanningSession | null): string[] {
  if (!session) return [];
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

function draftSourceLabel(source: "ai-suggested" | "student-chosen" | "student-edited") {
  if (source === "student-edited") return "You edited";
  if (source === "student-chosen") return "You chose";
  return "AI suggested";
}

function candidateSourceLabel(source: CandidateSystemPart["source"]) {
  if (source === "student-created") return "You added";
  if (source === "student-edited") return "You edited";
  return "AI suggested";
}

function goalFieldLabel(field: string) {
  if (field === "learnerGoal") return "Goal";
  if (field === "primaryObject") return "Main thing";
  if (field === "actor") return "Who uses it";
  if (field === "coreMechanic") return "Core mechanic";
  if (field === "endState") return "End state";
  return field;
}

export function BuildCompanionWorkspace() {
  const [activeStage, setActiveStage] = useState<StudioStage>("idea");
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("zh");
  const [idea, setIdea] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [planningSession, setPlanningSession] = useState<PlanningSession | null>(null);
  const [goalUnderstanding, setGoalUnderstanding] = useState<GoalUnderstanding | null>(null);
  const [understandingDetails, setUnderstandingDetails] = useState("");
  const [goalQuestionDraft, setGoalQuestionDraft] = useState("");
  const [planningQuestion, setPlanningQuestion] = useState<PlanningQuestion | null>(null);
  const [planningFreeInput, setPlanningFreeInput] = useState("");
  const [planningSelectedChoiceIds, setPlanningSelectedChoiceIds] = useState<string[]>([]);
  const [draftTrail, setDraftTrail] = useState<DraftSystemTrail | null>(null);
  const [firstDraftNodeId, setFirstDraftNodeId] = useState("");
  const [newCandidateTitle, setNewCandidateTitle] = useState("");
  const [newDraftTitle, setNewDraftTitle] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [roomStep, setRoomStep] = useState<RoomStep>("story");
  const [draftChecklists, setDraftChecklists] = useState<Record<string, string>>({});
  const [checklistFeedback, setChecklistFeedback] = useState<Record<string, ChecklistFeedbackResponse>>({});
  const [confirmedChecklist, setConfirmedChecklist] = useState<Record<string, ChecklistItem[]>>({});
  const [logicPlans, setLogicPlans] = useState<Record<string, MilestonePlanResponse>>({});
  const [code, setCode] = useState(STARTER_CODE);
  const [previewState, setPreviewState] = useState<PreviewState>({ status: "idle", runCount: 0, console: [] });
  const [runKey, setRunKey] = useState(0);
  const [debugDiagnosis, setDebugDiagnosis] = useState<DebugDiagnosisResponse | null>(null);
  const [observedBehavior, setObservedBehavior] = useState("Nothing changed yet.");
  const [missingCheckId, setMissingCheckId] = useState("");
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [assistantNote, setAssistantNote] = useState("Start with your idea. We will make the system visible before building.");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const t = useCallback((text: string | null | undefined) => translateUiText(text, uiLanguage), [uiLanguage]);
  const isZh = uiLanguage === "zh";

  const selectedNode = useMemo(() => currentNode(project, selectedNodeId), [project, selectedNodeId]);
  const selectedChecklist = selectedNode ? confirmedChecklist[selectedNode.id] ?? [] : [];
  const selectedDraft = selectedNode ? draftChecklists[selectedNode.id] ?? "" : "";
  const selectedFeedback = selectedNode ? checklistFeedback[selectedNode.id] : undefined;
  const selectedPlan = selectedNode ? logicPlans[selectedNode.id] : undefined;
  const nextNode = nextNodeAfter(project, selectedNode);
  const selectedStory = selectedPlan?.story ?? selectedNode?.suggestedMilestones?.[0] ?? {
    before: "This system part is not built yet.",
    after: selectedNode?.visibleBehavior ?? "One visible part changes."
  };
  const completedCount = project?.systemTrail.nodes.filter((node) => node.status === "completed").length ?? 0;
  const missingCheck =
    selectedChecklist.find((item) => item.id === missingCheckId) ??
    selectedChecklist.find((item) => item.status === "not-yet" || item.status === "not-sure") ??
    selectedChecklist[0];

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
    if (storedLanguage === "zh" || storedLanguage === "en") {
      setUiLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, uiLanguage);
    document.documentElement.lang = uiLanguage === "zh" ? "zh-CN" : "en";
  }, [uiLanguage]);

  useEffect(() => {
    setPlanningSelectedChoiceIds([]);
  }, [planningQuestion?.id]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setHasLoaded(true);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as {
        activeStage?: StudioStage;
        idea?: string;
        project?: Project;
        planningSession?: PlanningSession;
        goalUnderstanding?: GoalUnderstanding;
        understandingDetails?: string;
        goalQuestionDraft?: string;
        planningQuestion?: PlanningQuestion;
        draftTrail?: DraftSystemTrail;
        firstDraftNodeId?: string;
        selectedNodeId?: string;
        roomStep?: RoomStep;
        draftChecklists?: Record<string, string>;
        checklistFeedback?: Record<string, ChecklistFeedbackResponse>;
        confirmedChecklist?: Record<string, ChecklistItem[]>;
        logicPlans?: Record<string, MilestonePlanResponse>;
        code?: string;
        previewState?: PreviewState;
        runKey?: number;
        checkpoints?: Checkpoint[];
      };
      if (!parsed.project || parsed.project.systemTrail) {
        if (parsed.activeStage) setActiveStage(parsed.activeStage);
        if (typeof parsed.idea === "string") setIdea(parsed.idea);
        if (parsed.project?.systemTrail) setProject(parsed.project);
        if (parsed.planningSession) setPlanningSession(parsed.planningSession);
        if (parsed.goalUnderstanding) setGoalUnderstanding(parsed.goalUnderstanding);
        if (typeof parsed.understandingDetails === "string") setUnderstandingDetails(parsed.understandingDetails);
        if (typeof parsed.goalQuestionDraft === "string") setGoalQuestionDraft(parsed.goalQuestionDraft);
        if (parsed.planningQuestion) setPlanningQuestion(parsed.planningQuestion);
        if (parsed.draftTrail) setDraftTrail(parsed.draftTrail);
        if (parsed.firstDraftNodeId) setFirstDraftNodeId(parsed.firstDraftNodeId);
        if (parsed.selectedNodeId) setSelectedNodeId(parsed.selectedNodeId);
        if (parsed.roomStep) setRoomStep(parsed.roomStep);
        if (parsed.draftChecklists) setDraftChecklists(parsed.draftChecklists);
        if (parsed.checklistFeedback) setChecklistFeedback(parsed.checklistFeedback);
        if (parsed.confirmedChecklist) setConfirmedChecklist(parsed.confirmedChecklist);
        if (parsed.logicPlans) setLogicPlans(parsed.logicPlans);
        if (parsed.code) setCode(parsed.code);
        if (parsed.previewState) setPreviewState(parsed.previewState);
        if (typeof parsed.runKey === "number") setRunKey(parsed.runKey);
        if (parsed.checkpoints) setCheckpoints(parsed.checkpoints);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeStage,
        idea,
        project,
        planningSession,
        goalUnderstanding,
        understandingDetails,
        goalQuestionDraft,
        planningQuestion,
        draftTrail,
        firstDraftNodeId,
        selectedNodeId,
        roomStep,
        draftChecklists,
        checklistFeedback,
        confirmedChecklist,
        logicPlans,
        code,
        previewState,
        runKey,
        checkpoints
      })
    );
  }, [
    activeStage,
    idea,
    project,
    planningSession,
    goalUnderstanding,
    understandingDetails,
    goalQuestionDraft,
    planningQuestion,
    draftTrail,
    firstDraftNodeId,
    selectedNodeId,
    roomStep,
    draftChecklists,
    checklistFeedback,
    confirmedChecklist,
    logicPlans,
    code,
    previewState,
    runKey,
    checkpoints,
    hasLoaded
  ]);

  const onConsole = useCallback((line: string) => {
    setPreviewState((current) => ({
      ...current,
      console: [`[preview] ${line}`, ...current.console].slice(0, 20)
    }));
  }, []);

  const onPreviewError = useCallback((message: string) => {
    setPreviewState((current) => ({
      ...current,
      status: "error",
      error: message,
      console: [`[error] ${message}`, ...current.console].slice(0, 20)
    }));
    setActiveStage("debug");
    setObservedBehavior(message);
    setAssistantNote("Compare what you wanted with what you saw. Then fix one missing check.");
    if (project && selectedNode) setProject(updateNode(project, selectedNode.id, { status: "blocked" }));
  }, [project, selectedNode]);

  function resetStudio() {
    setActiveStage("idea");
    setIdea("");
    setProject(null);
    setPlanningSession(null);
    setGoalUnderstanding(null);
    setUnderstandingDetails("");
    setGoalQuestionDraft("");
    setPlanningQuestion(null);
    setPlanningFreeInput("");
    setPlanningSelectedChoiceIds([]);
    setDraftTrail(null);
    setFirstDraftNodeId("");
    setNewCandidateTitle("");
    setNewDraftTitle("");
    setSelectedNodeId("");
    setRoomStep("story");
    setDraftChecklists({});
    setChecklistFeedback({});
    setConfirmedChecklist({});
    setLogicPlans({});
    setCode(STARTER_CODE);
    setPreviewState({ status: "idle", runCount: 0, console: [] });
    setRunKey((key) => key + 1);
    setDebugDiagnosis(null);
    setObservedBehavior("Nothing changed yet.");
    setMissingCheckId("");
    setCheckpoints([]);
    setAssistantNote("Start with your idea. We will make the system visible before building.");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  async function createProject() {
    if (!idea.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<PlanningStartResponse>("/api/planning/start", { idea });
      setProject(response.project);
      setPlanningSession(response.planningSession);
      setGoalUnderstanding(response.goalUnderstanding);
      setPlanningQuestion(response.currentQuestion ?? null);
      setGoalQuestionDraft("");
      setDraftTrail(null);
      setFirstDraftNodeId("");
      setSelectedNodeId("");
      setCode(response.starterCode || STARTER_CODE);
      setActiveStage("understanding");
      setRoomStep("story");
      setAssistantNote(response.assistantMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not start co-planning");
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmUnderstanding(action: "confirm" | "revise" = "confirm") {
    if (!project || !planningSession) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<PlanningUnderstandingResponse>("/api/planning/understanding", {
        project,
        session: planningSession,
        action,
        extraDetail: understandingDetails
      });
      setProject(response.project);
      setPlanningSession(response.planningSession);
      setGoalUnderstanding(response.goalUnderstanding);
      setPlanningQuestion(response.currentQuestion ?? null);
      setAssistantNote(response.assistantMessage);
      if (action === "confirm") {
        setUnderstandingDetails("");
        setGoalQuestionDraft("");
        setActiveStage("coplan");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not confirm the goal understanding");
    } finally {
      setIsBusy(false);
    }
  }

  async function answerGoalQuestion(answer: string, source: "choice" | "free-input" | "not-sure") {
    if (!project || !planningSession || !goalUnderstanding?.goalReadiness?.nextQuestion) return;
    const cleanAnswer = answer.trim();
    if (!cleanAnswer) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<PlanningUnderstandingResponse>("/api/planning/understanding", {
        project,
        session: planningSession,
        action: "answer-goal-question",
        question: goalUnderstanding.goalReadiness.nextQuestion,
        answer: cleanAnswer,
        source
      });
      setProject(response.project);
      setPlanningSession(response.planningSession);
      setGoalUnderstanding(response.goalUnderstanding);
      setPlanningQuestion(response.currentQuestion ?? null);
      setGoalQuestionDraft("");
      setAssistantNote(response.assistantMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update the goal");
    } finally {
      setIsBusy(false);
    }
  }

  async function answerPlanning(answer: string, source: "choice" | "free-input" | "not-sure") {
    if (!planningSession || !planningQuestion) return;
    const cleanAnswer = answer.trim();
    if (!cleanAnswer) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<PlanningAnswerResponse>("/api/planning/answer", {
        session: planningSession,
        questionId: planningQuestion.id,
        answer: cleanAnswer,
        source
      });
      setPlanningSession(response.planningSession);
      setPlanningQuestion(response.currentQuestion ?? null);
      setPlanningFreeInput("");
      setPlanningSelectedChoiceIds([]);
      setAssistantNote(response.assistantMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save planning answer");
    } finally {
      setIsBusy(false);
    }
  }

  function togglePlanningChoice(choiceId: string) {
    if (!planningQuestion?.allowMultiple) {
      setPlanningSelectedChoiceIds([choiceId]);
      return;
    }
    setPlanningSelectedChoiceIds((current) => current.includes(choiceId)
      ? current.filter((id) => id !== choiceId)
      : [...current, choiceId]);
  }

  function submitSelectedPlanningChoices() {
    if (!planningQuestion) return;
    const selectedChoices = planningQuestion.choices.filter((choice) => planningSelectedChoiceIds.includes(choice.id));
    if (!selectedChoices.length) return;
    const answer = selectedChoices
      .map((choice) => choice.detail || choice.visibleBehavior ? `${choice.label}: ${choice.detail || choice.visibleBehavior}` : choice.label)
      .join("; ");
    void answerPlanning(answer, "choice");
  }

  function updateCandidate(partId: string, patch: Partial<CandidateSystemPart>) {
    setPlanningSession((current) => current
      ? {
        ...current,
        candidateParts: current.candidateParts.map((part) => (part.id === partId ? { ...part, ...patch } : part)),
        updatedAt: new Date().toISOString()
      }
      : current);
  }

  function moveCandidate(partId: string, direction: -1 | 1) {
    setPlanningSession((current) => {
      if (!current) return current;
      const next = [...current.candidateParts];
      const index = next.findIndex((part) => part.id === partId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, candidateParts: next, updatedAt: new Date().toISOString() };
    });
  }

  function addCandidatePart() {
    const title = newCandidateTitle.trim();
    if (!title) return;
    const part: CandidateSystemPart = {
      id: `candidate-student-${Date.now()}`,
      title,
      visibleBehavior: `The user can see or try: ${title}.`,
      systemRole: "student idea",
      selected: true,
      source: "student-created"
    };
    setPlanningSession((current) => current
      ? { ...current, candidateParts: [...current.candidateParts, part], updatedAt: new Date().toISOString() }
      : current);
    setNewCandidateTitle("");
  }

  async function createDraftTrail() {
    if (!planningSession) return;
    if (!planningSession.candidateParts.some((part) => part.selected)) {
      setError("Choose what belongs in your trail first.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<DraftTrailResponse>("/api/planning/draft", { session: planningSession });
      setPlanningSession(response.planningSession);
      setDraftTrail(response.draftTrail);
      setFirstDraftNodeId(response.draftTrail.nodes[0]?.id ?? "");
      setActiveStage("draft");
      setAssistantNote(response.assistantMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create draft trail");
    } finally {
      setIsBusy(false);
    }
  }

  function updateDraftNode(nodeId: string, patch: Partial<DraftSystemTrail["nodes"][number]>) {
    setDraftTrail((current) => current
      ? {
        ...current,
        nodes: current.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch, source: patch.source ?? "student-edited" } : node))
      }
      : current);
  }

  function moveDraftNode(nodeId: string, direction: -1 | 1) {
    setDraftTrail((current) => {
      if (!current) return current;
      const activeNodes = current.nodes.filter((node) => node.status !== "removed");
      const index = activeNodes.findIndex((node) => node.id === nodeId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= activeNodes.length) return current;
      [activeNodes[index], activeNodes[target]] = [activeNodes[target], activeNodes[index]];
      const nodes = activeNodes.map((node, nextIndex) => ({ ...node, order: nextIndex + 1, source: node.id === nodeId ? "student-edited" as const : node.source }));
      return {
        ...current,
        nodes,
        edges: nodes.slice(0, -1).map((node, nextIndex) => ({
          from: node.id,
          to: nodes[nextIndex + 1].id,
          type: nextIndex >= 2 ? "feedback-loop" : "sequence"
        }))
      };
    });
  }

  function addDraftNode() {
    const title = newDraftTitle.trim();
    if (!title) return;
    setDraftTrail((current) => {
      const nodes = [
        ...(current?.nodes.filter((node) => node.status !== "removed") ?? []),
        {
          id: `draft-node-student-${Date.now()}`,
          title,
          visibleBehavior: `The user can see or try: ${title}.`,
          systemRole: "student idea",
          order: (current?.nodes.length ?? 0) + 1,
          status: "draft" as const,
          source: "student-edited" as const
        }
      ].map((node, index) => ({ ...node, order: index + 1 }));
      return {
        nodes,
        edges: nodes.slice(0, -1).map((node, index) => ({
          from: node.id,
          to: nodes[index + 1].id,
          type: index >= 2 ? "feedback-loop" : "sequence"
        }))
      };
    });
    setNewDraftTitle("");
  }

  async function reviewDraft() {
    if (!planningSession || !draftTrail) return;
    const activeNodes = draftTrail.nodes.filter((node) => node.status !== "removed");
    if (activeNodes.length < 2) {
      setError("Keep at least two system parts before confirming.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const reviewedTrail = {
        ...draftTrail,
        nodes: activeNodes.map((node, index) => ({ ...node, order: index + 1 }))
      };
      const response = await postJson<DraftTrailResponse>("/api/planning/review", {
        session: planningSession,
        draftTrail: reviewedTrail
      });
      setPlanningSession(response.planningSession);
      setDraftTrail(response.draftTrail);
      setFirstDraftNodeId(response.draftTrail.nodes[0]?.id ?? "");
      setActiveStage("first");
      setAssistantNote(response.assistantMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not review draft trail");
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmFirstMilestone() {
    if (!project || !planningSession || !draftTrail || !firstDraftNodeId) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<ConfirmedTrailResponse>("/api/planning/confirm", {
        project,
        session: planningSession,
        draftTrail,
        selectedFirstNodeId: firstDraftNodeId
      });
      setProject(response.project);
      setPlanningSession(response.planningSession);
      setSelectedNodeId(response.project.currentFocusNodeId ?? response.project.systemTrail.nodes[0]?.id ?? "");
      setActiveStage("trail");
      setAssistantNote(response.assistantMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not confirm system trail");
    } finally {
      setIsBusy(false);
    }
  }

  function selectNode(node: SystemNode) {
    setSelectedNodeId(node.id);
    setAssistantNote(`Look at this system part: ${node.title}.`);
  }

  function buildSelectedNode() {
    if (!project || !selectedNode) return;
    if (planningSession?.status !== "completed") {
      setAssistantNote("Let's make the system visible first. You can change the trail before building.");
      setActiveStage(planningSession?.draftTrail ? "draft" : "coplan");
      return;
    }
    setProject(setCurrentNode(updateNode(project, selectedNode.id, { status: "building" }), selectedNode.id));
    setSelectedNodeId(selectedNode.id);
    setRoomStep("story");
    setActiveStage("room");
    setAssistantNote("Start with the story, then write your own checks.");
  }

  async function reviewSelectedChecklist() {
    if (!selectedNode) return;
    const draft = selectedDraft.trim();
    if (!draft) {
      setError("Write at least two checks first.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<ChecklistFeedbackResponse>("/api/checklist/review", {
        node: selectedNode,
        draftChecklist: draft
      });
      setChecklistFeedback((current) => ({ ...current, [selectedNode.id]: response }));
      setAssistantNote(response.assistantMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Checklist review failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmChecklist(source: "student" | "ai-suggested") {
    if (!selectedNode) return;
    const text = source === "ai-suggested" && selectedFeedback?.improvedChecklist.length
      ? selectedFeedback.improvedChecklist.join("\n")
      : selectedDraft;
    const items = checklistItemsFromText(text, source);
    if (items.length < 2) {
      setError("Write at least two checks that you can see or test.");
      return;
    }
    setConfirmedChecklist((current) => ({ ...current, [selectedNode.id]: items }));
    setDraftChecklists((current) => ({ ...current, [selectedNode.id]: text }));
    setRoomStep("logic");
    setAssistantNote("Your checks are the target. Now see the logic.");
  }

  async function createLogicPlan() {
    if (!selectedNode) return;
    if (!selectedChecklist.length) {
      setRoomStep("checks");
      setAssistantNote("Make your checks first so the logic has a clear target.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<MilestonePlanResponse>("/api/milestone/plan", {
        node: selectedNode,
        checklist: selectedChecklist.map((item) => item.text)
      });
      setLogicPlans((current) => ({ ...current, [selectedNode.id]: response }));
      setRoomStep("logic");
      setAssistantNote("The logic chain is ready. Review it, then build one small piece.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Logic plan failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function buildPatch() {
    if (!project || !selectedNode) return;
    if (!selectedChecklist.length) {
      setRoomStep("checks");
      setAssistantNote("Confirm your checks before building.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const patch = await postJson<PatchResponse>("/api/build/patch", {
        node: selectedNode,
        checklist: selectedChecklist.map((item) => item.text),
        currentCode: code
      });
      const nextPreviewState: PreviewState = { status: "idle", runCount: previewState.runCount, console: [] };
      const checkpoint = await postJson<Checkpoint>("/api/checkpoint/create", {
        projectId: project.id,
        nodeId: selectedNode.id,
        name: patch.checkpointName,
        filesSnapshot: { "sketch.js": patch.code },
        previewState: nextPreviewState
      });
      setCode(patch.code);
      setPreviewState(nextPreviewState);
      setCheckpoints((current) => [...current, checkpoint]);
      setProject(updateNode(project, selectedNode.id, { status: "building" }));
      setRoomStep("preview");
      setActiveStage("preview");
      setRunKey((key) => key + 1);
      setAssistantNote("One small build is ready. Run it, then check your list by hand.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Build failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function runPreview() {
    setIsBusy(true);
    setError(null);
    try {
      const response = await postJson<PreviewState>("/api/preview/run", {
        code,
        runCount: previewState.runCount
      });
      setPreviewState((current) => ({
        ...current,
        ...response,
        console: [...response.console, ...current.console].slice(0, 20)
      }));
      setRunKey((key) => key + 1);
      setActiveStage("preview");
      setRoomStep("preview");
      setAssistantNote("Now check what you can see. You decide yes, not yet, or not sure.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Preview failed");
    } finally {
      setIsBusy(false);
    }
  }

  function setCheckStatus(itemId: string, status: Exclude<ChecklistStatus, "unchecked">) {
    if (!selectedNode) return;
    setConfirmedChecklist((current) => ({
      ...current,
      [selectedNode.id]: (current[selectedNode.id] ?? []).map((item) => (item.id === itemId ? { ...item, status } : item))
    }));
    if (status !== "yes") {
      const item = selectedChecklist.find((candidate) => candidate.id === itemId);
      setMissingCheckId(itemId);
      setObservedBehavior(item ? `I do not see this yet: ${item.text}` : "I do not see it yet.");
      setAssistantNote("That is a useful observation. The Mismatch Lens can help.");
    }
  }

  async function diagnoseMismatch() {
    if (!selectedNode) return;
    setIsBusy(true);
    setError(null);
    try {
      const diagnosis = await postJson<DebugDiagnosisResponse>("/api/debug/diagnose", {
        node: selectedNode,
        visibleBehavior: observedBehavior,
        failedChecklistItem: missingCheck?.text
      });
      setDebugDiagnosis(diagnosis);
      setActiveStage("debug");
      setAssistantNote("Try one small fix for the missing check.");
      if (project) setProject(updateNode(project, selectedNode.id, { status: "blocked" }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Debug failed");
    } finally {
      setIsBusy(false);
    }
  }

  function completeCurrentNode() {
    if (!project || !selectedNode) return;
    const next = nextNodeAfter(project, selectedNode);
    let updated = updateNode(project, selectedNode.id, { status: "completed" });
    if (next) {
      updated = updateNode(updated, next.id, { status: "current" });
      updated.currentFocusNodeId = next.id;
    } else {
      updated.status = "complete";
    }
    setProject(updated);
    setActiveStage("growth");
    setRoomStep("changed");
    setAssistantNote("Your system grew. Look at what this step added.");
  }

  async function rollbackLatest() {
    const checkpoint = checkpoints[checkpoints.length - 1];
    if (!checkpoint) return;
    setIsBusy(true);
    try {
      const restored = await postJson<{ restoredCode: string; previewState: PreviewState }>("/api/checkpoint/rollback", {
        checkpoint
      });
      setCode(restored.restoredCode);
      setPreviewState(restored.previewState);
      setRunKey((key) => key + 1);
      setAssistantNote(`Rolled back to ${checkpoint.name}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Rollback failed");
    } finally {
      setIsBusy(false);
    }
  }

  function canOpen(stage: StudioStage) {
    if (stage === "idea") return true;
    if (stage === "understanding") return Boolean(project && planningSession && goalUnderstanding && planningSession.status !== "completed");
    if (stage === "coplan") return Boolean(project && planningSession && planningSession.status !== "completed" && !["goal_understanding_generated", "goal_understanding_needs_clarification"].includes(planningSession.status));
    if (stage === "draft") return Boolean(planningSession && draftTrail && planningSession.status !== "completed");
    if (stage === "first") return Boolean(planningSession && draftTrail && planningSession.status === "draft_trail_reviewed");
    if (stage === "trail") return Boolean(project?.systemTrail.nodes.length && planningSession?.status === "completed");
    if (stage === "room") return Boolean(project && selectedNode);
    if (stage === "preview") return Boolean(project && selectedChecklist.length);
    if (stage === "debug") return Boolean(project && selectedChecklist.length);
    return Boolean(project && selectedNode);
  }

  function renderAppBar() {
    const projectTitle = t(project?.title ?? "Open idea");
    const chips: Array<{ stage: StudioStage; label: string; icon: typeof Home }> = [
      { stage: "idea", label: "Idea", icon: Lightbulb },
      { stage: "understanding", label: "Understand", icon: Target },
      { stage: "coplan", label: "Co-plan", icon: Sparkles },
      { stage: "draft", label: "Review", icon: Pencil },
      { stage: "trail", label: "System Trail", icon: Workflow },
      { stage: "room", label: "Milestone Room", icon: Flag },
      { stage: "preview", label: "Preview", icon: Monitor },
      { stage: "growth", label: "Growth", icon: Sparkles }
    ];

    return (
      <header className="open-appbar">
        <button className="open-brand" type="button" onClick={() => setActiveStage(project ? (canOpen("trail") ? "trail" : canOpen("coplan") ? "coplan" : "understanding") : "idea")}>
          <span aria-hidden="true"><i /><i /><i /></span>
          <strong>{t("Goal-to-Milestone")}</strong>
        </button>
        <div className="open-breadcrumb">
          <button type="button" onClick={() => setActiveStage("idea")}>{t("My Projects")}</button>
          <span>/</span>
          <button type="button" onClick={() => project && setActiveStage(canOpen("trail") ? "trail" : canOpen("coplan") ? "coplan" : "understanding")}>{projectTitle}</button>
          <Pencil size={16} />
          <small><CheckCircle2 size={14} /> {t("All changes saved")}</small>
        </div>
        <nav className="open-stage-nav" aria-label={isZh ? "工作阶段" : "Studio stages"}>
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.stage}
                type="button"
                className={activeStage === chip.stage ? "active" : ""}
                disabled={!canOpen(chip.stage)}
                onClick={() => setActiveStage(chip.stage)}
              >
                <Icon size={15} />
                {t(chip.label)}
              </button>
            );
          })}
        </nav>
        <div className="open-actions">
          <span><Cloud size={17} /> {t("Saved just now")}</span>
          <button type="button"><CircleHelp size={17} /> {t("Help")}</button>
          <button
            className="language-toggle"
            type="button"
            aria-label={t("Language")}
            title={t("Language")}
            onClick={() => setUiLanguage((language) => (language === "zh" ? "en" : "zh"))}
          >
            {languageLabel(uiLanguage)}
          </button>
          <button type="button" onClick={resetStudio} title={t("New project")}><RefreshCcw size={17} /></button>
          <button type="button" onClick={rollbackLatest} disabled={!checkpoints.length} title={t("Rollback")}><RotateCcw size={17} /></button>
          <b>{isZh ? "我" : "A"}</b>
          <ChevronDown size={17} />
        </div>
      </header>
    );
  }

  function QuietAICard({ children, action }: { children: ReactNode; action?: { label: string; onClick: () => void } }) {
    return (
      <aside className="quiet-ai">
        <span><Sparkles size={22} /></span>
        <div>
          <small>{isZh ? "安静 AI" : "Quiet AI"}</small>
          <p>{typeof children === "string" ? t(children) : children}</p>
          {action && (
            <button type="button" onClick={action.onClick}>
              {t(action.label)}
            </button>
          )}
        </div>
      </aside>
    );
  }

  function renderIdeaStudio() {
    return (
      <section className="idea-studio">
        <div className="idea-hero">
          <span className="step-pill">{t("Open-ended start")}</span>
          <h1>{t("What do you want to make happen?")}</h1>
          <p>{t("Start with any personally meaningful idea. We will turn it into a visible system trail before building.")}</p>
          <label className="idea-input-card">
            <span>{t("Your project idea")}</span>
            <textarea
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder={t("I want to make a pet adventure game...")}
              maxLength={500}
              aria-label={t("Project idea")}
            />
          </label>
          <button className="open-primary big" type="button" onClick={createProject} disabled={isBusy || !idea.trim()}>
            <Sparkles size={20} />
            {t("Start co-planning")}
            <ArrowRight size={20} />
          </button>
        </div>

        <section className="idea-examples" aria-label={t("Optional starters")}>
          <div>
            <h2>{t("Optional starters")}</h2>
            <p>{t("Pick one only if you want a quick seed. Your own idea can be anything.")}</p>
          </div>
          <div className="starter-grid-open">
            {starterIdeas.map((starter) => {
              const Icon = starter.icon;
              return (
                <button key={starter.title} type="button" onClick={() => setIdea(isZh ? t(starter.idea) : starter.idea)}>
                  <Icon size={24} />
                  <strong>{t(starter.title)}</strong>
                  <span>{t(starter.detail)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="idea-side-note">
          <QuietAICard>First we make the system visible. Code waits until you choose one small part and write your checks.</QuietAICard>
          <div className="studio-principles">
            <span><Target size={18} /> {t("My idea stays visible")}</span>
            <span><Workflow size={18} /> {t("I can see the system")}</span>
            <span><ListChecks size={18} /> {t("I choose how to check it")}</span>
          </div>
        </aside>
      </section>
    );
  }

  function renderGoalUnderstanding() {
    if (!project || !planningSession || !goalUnderstanding) return renderIdeaStudio();
    const goalContract = goalUnderstanding.goalContract ?? {
      learnerGoal: goalUnderstanding.learnerFacingRestatement,
      primaryObject: goalUnderstanding.primaryObject,
      actor: goalUnderstanding.userActor,
      coreMechanic: goalUnderstanding.desiredChange,
      endState: goalUnderstanding.likelyOutput
    };
    const readiness = goalUnderstanding.goalReadiness ?? {
      readyForConfirmation: goalUnderstanding.confidence !== "low",
      missingFields: [],
      confidence: goalUnderstanding.confidence,
      rationale: "Check this goal before planning.",
      nextQuestion: null
    };
    const projectGoalSentence = goalContract.learnerGoal || goalUnderstanding.learnerFacingRestatement || project.originalIdea;
    const goalLabel = planningSession.status === "goal_understanding_confirmed" ? "Confirmed project goal" : "Working project goal";
    const contractSlots = [
      { label: "Main project object", helper: "What moves, changes, or gets acted on", value: goalContract.primaryObject, field: "primaryObject" },
      { label: "Main mechanic", helper: "What the user does and what changes", value: goalContract.coreMechanic, field: "coreMechanic" },
      { label: "Success state", helper: "How someone knows it worked", value: goalContract.endState, field: "endState" }
    ];
    const goalQuestion = readiness.nextQuestion;

    return (
      <section className="understanding-screen">
        <aside className="coplan-idea-card">
          <span><Lightbulb size={20} /></span>
          <h2>{t("Starting idea")}</h2>
          <p>{project.originalIdea}</p>
          <hr />
          <small>{t(goalLabel)}</small>
          <strong className="side-goal-sentence">{t(projectGoalSentence)}</strong>
          <hr />
          <small>{t("Internal lens")}</small>
          <strong>{t(goalUnderstanding.planningLens.replace(/-/g, " "))}</strong>
          <small>{t("Not a template choice")}</small>
        </aside>

        <main className="understanding-main">
          <header className="screen-heading">
            <span className="step-pill">{t("Goal understanding")}</span>
            <h1>{t("I think you want to make:")}</h1>
            <p>{t("Check if this feels right before we ask planning questions.")}</p>
          </header>

          <section className="understanding-card">
            <div className="understanding-title-row">
              <span><Target size={24} /></span>
              <div>
                <h2>{t(goalUnderstanding.projectTitle)}</h2>
                <p>{t(goalUnderstanding.learnerFacingRestatement)}</p>
              </div>
            </div>

            <div className="goal-readiness-row">
              <span className={readiness.readyForConfirmation ? "ready" : "not-ready"}>
                {readiness.readyForConfirmation ? t("Ready to confirm") : t("Needs one more detail")}
              </span>
              <p>{t(readiness.rationale)}</p>
            </div>

            <div className="goal-sentence-panel">
              <small>{t("One-sentence project goal")}</small>
              <strong>{t(projectGoalSentence)}</strong>
              <p>{t(readiness.readyForConfirmation ? "This is the sentence we will carry into co-planning." : "This sentence will keep changing as you answer.")}</p>
            </div>

            <div className="understanding-slots goal-contract-grid" aria-label={isZh ? "目标合同" : "Goal contract"}>
              {contractSlots.map((item) => {
                const missing = (readiness.missingFields as string[]).includes(item.field);
                return (
                <article key={item.label} className={missing ? "missing" : ""}>
                  <small>{t(item.label)}</small>
                  <strong>{t(item.value || "Not sure yet")}</strong>
                  <p>{t(item.helper)}</p>
                  {missing && <em>{t("Still unclear")}</em>}
                </article>
              );})}
            </div>

            {goalContract.actor && (
              <p className="goal-context-note">
                <User size={16} />
                <span>{t("Experience context")}: {t(goalContract.actor)}</span>
              </p>
            )}

            {!!goalUnderstanding.safetyOrBoundaryNotes.length && (
              <p className="boundary-note-open">
                <Lightbulb size={17} />
                {t(goalUnderstanding.safetyOrBoundaryNotes[0])}
              </p>
            )}

            {goalQuestion && (
              <div className="understanding-clarify goal-question-panel">
                <strong>{t("I’m not fully sure yet.")}</strong>
                <p>{t(goalQuestion.prompt)}</p>
                <div>
                  {goalQuestion.choices.map((choice) => (
                    <button key={choice.id} type="button" onClick={() => answerGoalQuestion(choice.label, "choice")} disabled={isBusy}>
                      <strong>{t(choice.label)}</strong>
                      {(choice.detail || choice.visibleBehavior) && <small>{t(choice.detail || choice.visibleBehavior)}</small>}
                    </button>
                  ))}
                </div>
                <label className="goal-question-input">
                  <span>{t("Type my answer")}</span>
                  <textarea
                    value={goalQuestionDraft}
                    onChange={(event) => setGoalQuestionDraft(event.target.value)}
                    placeholder={t("For example: the player feeds the pet and tries to keep it happy...")}
                    maxLength={360}
                  />
                </label>
                <div className="understanding-actions">
                  <button className="open-secondary" type="button" onClick={() => answerGoalQuestion(goalQuestionDraft, "free-input")} disabled={isBusy || !goalQuestionDraft.trim()}>
                    {t("Add mine")}
                  </button>
                  <button className="open-secondary quiet" type="button" onClick={() => answerGoalQuestion("I'm not sure yet", "not-sure")} disabled={isBusy}>
                    {t("I'm not sure")}
                  </button>
                </div>
              </div>
            )}

            <label className="understanding-detail-input">
              <span>{t("Change this or add more details")}</span>
              <textarea
                value={understandingDetails}
                onChange={(event) => setUnderstandingDetails(event.target.value)}
                placeholder={t("For example: users upload a drawing and choose anime style...")}
                maxLength={360}
              />
            </label>

            <div className="understanding-actions">
              <button className="open-primary big" type="button" onClick={() => confirmUnderstanding("confirm")} disabled={isBusy || !readiness.readyForConfirmation}>
                {t("Yes, start planning")}
                <ArrowRight size={19} />
              </button>
              <button className="open-secondary" type="button" onClick={() => confirmUnderstanding("revise")} disabled={isBusy || !understandingDetails.trim()}>
                {t("Change this")}
              </button>
              <button className="open-secondary quiet" type="button" onClick={() => setUnderstandingDetails(`${understandingDetails}${understandingDetails ? " " : ""}I want to add more detail.`)}>
                {t("Add more details")}
              </button>
            </div>
          </section>
        </main>

        <aside className="coplan-preview-panel">
          <span className="draft-badge">{t("Before co-planning")}</span>
          <h2>{t("Question plan")}</h2>
          <ol>
            {goalUnderstanding.recommendedCoPlanningStrategy.questionSequence.map((question, index) => (
              <li key={question}>
                <span>{index + 1}</span>
                <p>{t(question)}</p>
              </li>
            ))}
          </ol>
          <QuietAICard>{t(goalUnderstanding.quietAI)}</QuietAICard>
        </aside>
      </section>
    );
  }

  function renderDraftPreviewCard() {
    const previewNodes = planningPreviewNodes(planningSession);
    return (
      <aside className="coplan-preview-panel">
        <span className="draft-badge">{t("Not final yet")}</span>
        <h2>{t("Draft trail so far")}</h2>
        {previewNodes.length ? (
          <ol>
            {previewNodes.map((node, index) => (
              <li key={`${node}-${index}`}>
                <span>{index + 1}</span>
                <p>{t(node)}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-draft-preview">
            <Workflow size={34} />
            <p>{t("Draft trail will appear here as you answer.")}</p>
          </div>
        )}
        <QuietAICard>The canvas comes later. This is a draft you help shape.</QuietAICard>
      </aside>
    );
  }

  function renderPlanningChoice(choice: PlanningChoice) {
    const selected = planningSelectedChoiceIds.includes(choice.id);
    return (
      <button
        key={choice.id}
        type="button"
        className={selected ? "selected" : ""}
        onClick={() => togglePlanningChoice(choice.id)}
        disabled={isBusy}
      >
        <strong>{t(choice.label)}</strong>
        {(choice.detail || choice.visibleBehavior) && <small>{t(choice.detail || choice.visibleBehavior)}</small>}
        {selected ? <Check size={16} /> : <Plus size={16} />}
      </button>
    );
  }

  function renderPlanningQuestion() {
    if (!planningQuestion) return null;

    return (
      <section className="coplan-question-card">
        <span className="step-pill">{t("Co-planning question")}</span>
        <h1>{t(planningQuestion.prompt)}</h1>
        {planningQuestion.boundaryNote && (
          <p className="boundary-note-open">
            <Lightbulb size={17} />
            {t(planningQuestion.boundaryNote)}
          </p>
        )}
        {!!planningQuestion.choices.length && (
          <div className="planning-choice-grid">
            {planningQuestion.choices.map(renderPlanningChoice)}
          </div>
        )}
        {!!planningQuestion.choices.length && (
          <button
            className="open-primary"
            type="button"
            onClick={submitSelectedPlanningChoices}
            disabled={isBusy || planningSelectedChoiceIds.length === 0}
          >
            {planningQuestion.allowMultiple ? t("Use selected choices") : t("Use this choice")}
            <ArrowRight size={17} />
          </button>
        )}
        <div className="planning-free-row">
          <input
            value={planningFreeInput}
            onChange={(event) => setPlanningFreeInput(event.target.value)}
            placeholder={t("Type my own...")}
            aria-label={t("Type my own planning answer")}
          />
          <button className="open-secondary" type="button" onClick={() => answerPlanning(planningFreeInput, "free-input")} disabled={isBusy || !planningFreeInput.trim()}>
            {t("Add mine")}
          </button>
          <button className="open-secondary quiet" type="button" onClick={() => answerPlanning("I'm not sure yet", "not-sure")} disabled={isBusy}>
            {t("I'm not sure")}
          </button>
        </div>
        <QuietAICard>{t(planningQuestion.quietAiNote)}</QuietAICard>
      </section>
    );
  }

  function renderCandidateParts() {
    if (!planningSession) return null;
    return (
      <section className="coplan-question-card candidate-parts-card">
        <span className="step-pill">{t("Choose what belongs in your trail")}</span>
        <h1>{t("Which parts should be in your system trail?")}</h1>
        <p>{t("Select, rename, add, or reorder. This is still a draft.")}</p>
        <div className="candidate-list-open">
          {planningSession.candidateParts.map((part, index) => (
            <article key={part.id} className={part.selected ? "selected" : ""}>
              <button type="button" className="candidate-check" onClick={() => updateCandidate(part.id, { selected: !part.selected })}>
                {part.selected ? <Check size={18} /> : index + 1}
              </button>
              <input
                value={t(part.title)}
                onChange={(event) => updateCandidate(part.id, { title: event.target.value, source: part.source === "student-created" ? "student-created" : "student-edited" })}
                aria-label={isZh ? `重命名 ${t(part.title)}` : `Rename ${part.title}`}
              />
              <small>{t(candidateSourceLabel(part.source))}</small>
              <div>
                <button type="button" onClick={() => moveCandidate(part.id, -1)} disabled={index === 0}>{isZh ? "上移" : "Up"}</button>
                <button type="button" onClick={() => moveCandidate(part.id, 1)} disabled={index === planningSession.candidateParts.length - 1}>{isZh ? "下移" : "Down"}</button>
              </div>
            </article>
          ))}
        </div>
        <div className="planning-free-row">
          <input value={newCandidateTitle} onChange={(event) => setNewCandidateTitle(event.target.value)} placeholder={t("Add my own system part...")} />
          <button className="open-secondary" type="button" onClick={addCandidatePart} disabled={!newCandidateTitle.trim()}>
            <Plus size={16} />
            {t("Add part")}
          </button>
        </div>
        <button className="open-primary big" type="button" onClick={createDraftTrail} disabled={isBusy || !planningSession.candidateParts.some((part) => part.selected)}>
          {t("Review draft trail")}
          <ArrowRight size={19} />
        </button>
      </section>
    );
  }

  function renderCoPlanningStudio() {
    if (!project || !planningSession) return renderIdeaStudio();
    const hasCandidates = planningSession.candidateParts.length > 0 && planningSession.status === "system_response_clarified";
    const confirmedGoalSentence = planningSession.goalUnderstanding?.goalContract?.learnerGoal || goalUnderstanding?.goalContract?.learnerGoal || project.shortDescription || project.originalIdea;

    return (
      <section className="coplan-screen">
        <aside className="coplan-idea-card">
          <span><Lightbulb size={20} /></span>
          <h2>{t("Confirmed project goal")}</h2>
          <p className="side-goal-sentence">{t(confirmedGoalSentence)}</p>
          <hr />
          <small>{t("Starting idea")}</small>
          <p>{project.originalIdea}</p>
          <hr />
          <small>{t("We are co-planning first.")}</small>
          <strong>{t("No final canvas yet")}</strong>
        </aside>
        <main className="coplan-main">
          <header className="screen-heading">
            <h1>{t("Let’s build your system trail together.")}</h1>
            <p>{t("Answer a few quick questions. You can choose an option or type your own.")}</p>
          </header>
          {hasCandidates ? renderCandidateParts() : renderPlanningQuestion()}
        </main>
        {renderDraftPreviewCard()}
      </section>
    );
  }

  function renderDraftTrailReview() {
    if (!draftTrail) return renderCoPlanningStudio();
    const activeNodes = draftTrail.nodes.filter((node) => node.status !== "removed");
    return (
      <section className="draft-review-screen">
        <aside className="coplan-idea-card">
          <span><Pencil size={20} /></span>
          <h2>{t("Review first")}</h2>
          <p>{project?.originalIdea}</p>
          <hr />
          <small>{t("System Trail Canvas is not generated for you.")}</small>
          <strong>{t("You confirm the system.")}</strong>
        </aside>
        <main className="draft-review-main">
          <header className="screen-heading">
            <h1>{t("Review your draft system trail")}</h1>
            <p>{t("This is a first version. You can change it before building.")}</p>
          </header>
          <div className="draft-node-list-open">
            {activeNodes.map((node, index) => (
              <article key={node.id}>
                <span>{index + 1}</span>
                <div>
                  <input
                    value={t(node.title)}
                    onChange={(event) => updateDraftNode(node.id, { title: event.target.value, source: "student-edited" })}
                    aria-label={isZh ? `重命名 ${t(node.title)}` : `Rename ${node.title}`}
                  />
                  <p>{t(node.visibleBehavior)}</p>
                  <small>{t(draftSourceLabel(node.source))}</small>
                </div>
                <div>
                  <button type="button" onClick={() => moveDraftNode(node.id, -1)} disabled={index === 0}>{isZh ? "上移" : "Move up"}</button>
                  <button type="button" onClick={() => moveDraftNode(node.id, 1)} disabled={index === activeNodes.length - 1}>{isZh ? "下移" : "Move down"}</button>
                  <button type="button" onClick={() => updateDraftNode(node.id, { status: "removed", source: "student-edited" })}>{isZh ? "移除" : "Remove"}</button>
                </div>
              </article>
            ))}
          </div>
          <div className="planning-free-row">
            <input value={newDraftTitle} onChange={(event) => setNewDraftTitle(event.target.value)} placeholder={t("Add another visible part...")} />
            <button className="open-secondary" type="button" onClick={addDraftNode} disabled={!newDraftTitle.trim()}>
              <Plus size={16} />
              {t("Add part")}
            </button>
          </div>
          <button className="open-primary big" type="button" onClick={reviewDraft} disabled={isBusy || activeNodes.length < 2}>
            {t("Confirm trail")}
            <ArrowRight size={20} />
          </button>
        </main>
        <aside className="coplan-preview-panel">
          <span className="draft-badge">{t("Draft review")}</span>
          <h2>{t("Source labels")}</h2>
          <div className="source-label-stack">
            <span>{t("AI suggested")}</span>
            <span>{t("You edited")}</span>
            <span>{t("You chose")}</span>
          </div>
          <QuietAICard>Confirming is part of the thinking. You can still change it later.</QuietAICard>
        </aside>
      </section>
    );
  }

  function renderFirstMilestoneChoice() {
    if (!draftTrail) return renderDraftTrailReview();
    const activeNodes = draftTrail.nodes.filter((node) => node.status !== "removed");
    return (
      <section className="first-milestone-screen">
        <main className="first-milestone-main">
          <header className="screen-heading">
            <span className="step-pill">{t("First bounded milestone")}</span>
            <h1>{t("Which part should we build first?")}</h1>
            <p>{t("Choose one part from the trail you reviewed. Coding still waits until you write your checks.")}</p>
          </header>
          <div className="first-node-grid-open">
            {activeNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                className={firstDraftNodeId === node.id ? "active" : ""}
                onClick={() => setFirstDraftNodeId(node.id)}
              >
                <span>{node.order}</span>
                <strong>{t(node.title)}</strong>
                <small>{t(node.visibleBehavior)}</small>
              </button>
            ))}
          </div>
          <button className="open-primary big" type="button" onClick={confirmFirstMilestone} disabled={isBusy || !firstDraftNodeId}>
            {t("Confirm first build step")}
            <ArrowRight size={20} />
          </button>
        </main>
        <aside className="coplan-preview-panel">
          <span className="draft-badge">{t("Almost final")}</span>
          <h2>{t("What happens next?")}</h2>
          <ol>
            <li><span>1</span><p>{t("Confirmed System Trail Canvas appears.")}</p></li>
            <li><span>2</span><p>{t("You open one Milestone Room.")}</p></li>
            <li><span>3</span><p>{t("You write checks before build.")}</p></li>
          </ol>
          <QuietAICard>Let’s make the system visible first. You can change the trail before building.</QuietAICard>
        </aside>
      </section>
    );
  }

  function renderProjectRail() {
    const progressTotal = project?.systemTrail.nodes.length ?? 0;
    const Icon = nodeIcon(selectedNode);
    return (
      <aside className="project-rail">
        <span className="project-orb-open"><Icon size={36} /></span>
        <h2>{t(project?.title ?? "No project yet")}</h2>
        <p>{t(project?.shortDescription ?? "Start with an idea to make a system trail.")}</p>
        <hr />
        <small>{t("Current focus")}</small>
        <strong className="focus-chip-open">
          <span />
          {t(selectedNode?.title ?? "Idea")}
        </strong>
        <div className="progress-line">
          <span>{t("Progress")}</span>
          <b>{isZh ? `${completedCount} / ${progressTotal}` : `${completedCount} of ${progressTotal}`}</b>
          <i><em style={{ width: progressTotal ? `${(completedCount / progressTotal) * 100}%` : "0%" }} /></i>
        </div>
        <hr />
        <span className="date-row"><Save size={16} /> {t("Updated just now")}</span>
      </aside>
    );
  }

  function renderSystemTrailCanvas() {
    if (!project) return renderIdeaStudio();
    if (!project.systemTrail.nodes.length || planningSession?.status !== "completed") {
      return (
        <section className="gate-screen-open">
          <div className="room-panel">
            <span className="step-kicker">{t("Co-planning first")}</span>
            <h1>{t("Let’s make the system visible first.")}</h1>
            <p>{t("You can change the trail before building. The final System Trail Canvas appears after you review and confirm the draft.")}</p>
            <button className="open-primary" type="button" onClick={() => setActiveStage(planningSession?.draftTrail ? "draft" : canOpen("coplan") ? "coplan" : "understanding")}>
              {t("Back to co-planning")}
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      );
    }
    return (
      <section className="trail-screen">
        {renderProjectRail()}
        <section className="trail-main">
          <header className="screen-heading">
            <h1>{t("System Trail Canvas")}</h1>
            <p>{t("Your project as a system of visible parts. Choose one part to build next.")}</p>
          </header>

          <div className="trail-canvas-open">
            <span className="abstract-rail rail-a" />
            <span className="abstract-rail rail-b" />
            <span className="abstract-rail rail-c" />
            <div className="trail-tile-row">
              {project.systemTrail.nodes.map((node) => {
                const Icon = nodeIcon(node);
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`system-tile-open ${statusClass(node, selectedNode?.id ?? "")}`}
                    onClick={() => selectNode(node)}
                  >
                    <span className="node-number">{node.order}</span>
                    <Icon size={34} />
                    <strong>{t(node.title)}</strong>
                    <small>{t(node.status === "completed" ? "Completed" : node.status === "current" || node.status === "building" ? "Current focus" : "Upcoming")}</small>
                    {node.status === "completed" && <Check className="tile-check" size={20} />}
                  </button>
                );
              })}
            </div>
            {selectedNode && (
              <div className="canvas-ai-anchor">
                <QuietAICard action={{ label: "Ask why", onClick: () => setAssistantNote(selectedNode.suggestedMilestones?.[0]?.rationale ?? selectedNode.visibleBehavior) }}>
                  {selectedNode.status === "planned" ? "This part may depend on earlier steps. Want to build it now or split it smaller?" : "Small steps help your project grow."}
                </QuietAICard>
              </div>
            )}
          </div>

          <div className="trail-legend-open">
            <span><Check size={15} /> {t("Completed")}</span>
            <span><i /> {t("Current focus")}</span>
            <span><b /> {t("Upcoming")}</span>
          </div>
        </section>

        <aside className="node-detail-panel">
          {selectedNode ? (
            <>
              <div className="detail-title">
                <span>{selectedNode.order}</span>
                <div>
                  <h2>{t(selectedNode.title)}</h2>
                  <p>{t(selectedNode.visibleBehavior)}</p>
                </div>
              </div>
              <hr />
              <section>
                <Lightbulb size={22} />
                <div>
                  <h3>{t("Why it matters")}</h3>
                  <p>{t(selectedNode.suggestedMilestones?.[0]?.rationale ?? "This part helps the user understand what happened.")}</p>
                </div>
              </section>
              <section>
                <Workflow size={22} />
                <div>
                  <h3>{t("What this step includes")}</h3>
                  <ul>
                    <li>{t("A visible behavior the learner can test")}</li>
                    <li>{isZh ? `系统角色：${t(selectedNode.systemRole)}` : `A system role: ${selectedNode.systemRole}`}</li>
                    <li>{t("A connection to another project part")}</li>
                  </ul>
                </div>
              </section>
              {!!selectedNode.dependencies?.length && (
                <section className="dependency-note">
                  <GitBranch size={22} />
                  <div>
                    <h3>{t("Needs first")}</h3>
                    <p>{selectedNode.dependencies.map((dependency) => t(dependency)).join(isZh ? "，" : ", ")}</p>
                  </div>
                </section>
              )}
              <button className="open-primary full" type="button" onClick={buildSelectedNode}>
                <Sparkles size={18} />
                {t("Build this next")}
                <ArrowRight size={18} />
              </button>
              <button className="open-secondary full" type="button" onClick={() => setAssistantNote("Try splitting this into one visible result, one check, and one preview test.")}>
                <GitBranch size={18} />
                {t("Split into smaller steps")}
              </button>
              <button className="open-secondary full quiet" type="button" onClick={() => setAssistantNote(selectedNode.suggestedMilestones?.[0]?.rationale ?? "This part makes the system easier to understand.")}>
                <Sparkles size={18} />
                {t("Ask AI why")}
              </button>
            </>
          ) : (
            <p>{t("Select a system tile to see its details.")}</p>
          )}
        </aside>
      </section>
    );
  }

  function renderProjectMapCompact() {
    if (!project) return null;
    return (
      <aside className="compact-map">
        <h2><MapIcon size={22} /> {t("System Trail")}</h2>
        <div>
          {project.systemTrail.nodes.map((node) => {
            const Icon = nodeIcon(node);
            return (
              <button
                key={node.id}
                type="button"
                className={`${statusClass(node, selectedNode?.id ?? "")}`}
                onClick={() => {
                  selectNode(node);
                  setActiveStage("trail");
                }}
              >
                <span>{node.status === "completed" ? <Check size={17} /> : node.order}</span>
                <Icon size={20} />
                <div>
                  <strong>{t(node.title)}</strong>
                  <small>{t(node.visibleBehavior)}</small>
                </div>
                <ArrowRight size={15} />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  function renderRoomStepper() {
    return (
      <aside className="room-stepper">
        <h2>{t("Milestone Room")}</h2>
        <p>{t("One scaffold at a time.")}</p>
        {roomSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              type="button"
              className={roomStep === step.id ? "active" : ""}
              onClick={() => setRoomStep(step.id)}
            >
              <span>{index + 1}</span>
              <Icon size={18} />
              <div>
                <strong>{t(step.label)}</strong>
                <small>{t(step.detail)}</small>
              </div>
            </button>
          );
        })}
        <QuietAICard>{assistantNote}</QuietAICard>
      </aside>
    );
  }

  function renderStoryStep() {
    return (
      <section className="room-panel story-step">
        <span className="step-kicker">{t("This step")}</span>
        <h1>{t(selectedNode?.title ?? "Choose a system part")}</h1>
        <p>{t(selectedNode?.visibleBehavior ?? "Pick a tile from the System Trail Canvas.")}</p>
        <div className="before-after-open">
          <article>
            <small>{t("Before")}</small>
            <p>{t(selectedStory.before)}</p>
          </article>
          <ArrowRight size={28} />
          <article>
            <small>{t("After")}</small>
            <p>{t(selectedStory.after)}</p>
          </article>
        </div>
        <button className="open-primary" type="button" onClick={() => setRoomStep("checks")}>
          {t("Write my checks")}
          <ArrowRight size={18} />
        </button>
      </section>
    );
  }

  function renderChecksStep() {
    return (
      <section className="room-panel checks-step">
        <div className="panel-title-row">
          <div>
            <span className="step-kicker">{t("My checks")}</span>
            <h1>{t("What should happen when this step is done?")}</h1>
            <p>{t("Write 2-4 things you can see or test. These are your words first.")}</p>
          </div>
          <button className="open-secondary" type="button" onClick={() => selectedNode && setDraftChecklists((current) => ({ ...current, [selectedNode.id]: t(starterChecksForNode(selectedNode)) }))}>
            {t("Show example")}
          </button>
        </div>
        <div className="sentence-starters">
          {sentenceStarters.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => selectedNode && setDraftChecklists((current) => ({ ...current, [selectedNode.id]: `${selectedDraft}${selectedDraft ? "\n" : ""}${t(starter)}` }))}
            >
              {t(starter)}
            </button>
          ))}
        </div>
        <textarea
          value={selectedDraft}
          placeholder={t(starterChecksForNode(selectedNode))}
          onChange={(event) => selectedNode && setDraftChecklists((current) => ({ ...current, [selectedNode.id]: event.target.value }))}
          aria-label={t("Student-authored checklist")}
        />
        {selectedFeedback && (
          <div className="ai-suggestion-soft">
            <Sparkles size={19} />
            <div>
              <strong>{t(selectedFeedback.assistantMessage)}</strong>
              <ul>
                {selectedFeedback.improvedChecklist.map((item) => <li key={item}>{t(item)}</li>)}
              </ul>
            </div>
          </div>
        )}
        <div className="button-row-open">
          <button className="open-secondary" type="button" onClick={reviewSelectedChecklist} disabled={isBusy || !selectedDraft.trim()}>
            <Sparkles size={17} />
            {t("Ask Quiet AI")}
          </button>
          {selectedFeedback && (
            <button className="open-secondary" type="button" onClick={() => confirmChecklist("ai-suggested")} disabled={isBusy}>
              {t("Use suggestion")}
            </button>
          )}
          <button className="open-primary" type="button" onClick={() => confirmChecklist("student")} disabled={isBusy || parseChecklistText(selectedDraft).length < 2}>
            {t("Keep my words")}
            <ArrowRight size={17} />
          </button>
        </div>
      </section>
    );
  }

  function renderLogicStep() {
    const chain = selectedPlan?.logicChain ?? [];
    return (
      <section className="room-panel logic-step-open">
        <span className="step-kicker">{t("See the logic")}</span>
        <h1>{t("Logic Chain")}</h1>
        <p>{t("Systems thinking first: action, change, result, understanding.")}</p>
        {!chain.length ? (
          <button className="open-primary" type="button" onClick={createLogicPlan} disabled={isBusy || !selectedChecklist.length}>
            <Workflow size={18} />
            {t("Create logic chain")}
          </button>
        ) : (
          <>
            <div className="logic-chain-open">
              {chain.map((step, index) => (
                <article key={step.id}>
                  <span>{index + 1}</span>
                  <strong>{t(step.title)}</strong>
                  <small>{t(roleLabel(step.role))}</small>
                  <p>{t(step.detail)}</p>
                  {index < chain.length - 1 && <ArrowRight size={20} />}
                </article>
              ))}
            </div>
            <button className="open-primary" type="button" onClick={() => setRoomStep("build")}>
              {t("Build this logic")}
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </section>
    );
  }

  function renderBuildStep() {
    return (
      <section className="room-panel build-step-open">
        <span className="step-kicker">{t("Build and try")}</span>
        <h1>{t("Turn one system part into the preview.")}</h1>
        <p>{isZh ? `不生成完整项目。这次只制作：${t(selectedNode?.title ?? "one selected part")}。` : `No full project generation. This build targets only: ${selectedNode?.title ?? "one selected part"}.`}</p>
        <div className="build-target-card">
          <Wand2 size={28} />
          <div>
            <strong>{t(selectedNode?.visibleBehavior)}</strong>
            <span>{isZh ? `${selectedChecklist.length} 条检查会由学习者测试。` : `${selectedChecklist.length} checks will be tested by the learner.`}</span>
          </div>
        </div>
        <button className="open-primary big" type="button" onClick={buildPatch} disabled={isBusy || !selectedChecklist.length}>
          <Sparkles size={20} />
          {t("Build this step")}
          <ArrowRight size={20} />
        </button>
      </section>
    );
  }

  function renderChecklistTestPanel() {
    return (
      <aside className="check-test-panel">
        <h2><ListChecks size={20} /> {t("Check preview")}</h2>
        <p>{t("You decide what happened. The app does not auto-complete your checks.")}</p>
        {selectedChecklist.length ? (
          selectedChecklist.map((item) => (
            <article key={item.id}>
              <p>{t(item.text)}</p>
              <div>
                {(["yes", "not-yet", "not-sure"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={item.status === status ? "active" : ""}
                    onClick={() => setCheckStatus(item.id, status)}
                  >
                    {t(status === "yes" ? "Yes" : status === "not-yet" ? "Not yet" : "I'm not sure")}
                  </button>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p>{t("No checks yet.")}</p>
        )}
        <button className="open-primary full" type="button" onClick={completeCurrentNode} disabled={!selectedChecklist.length || selectedChecklist.some((item) => item.status !== "yes")}>
          {t("Your system grew")}
          <ArrowRight size={17} />
        </button>
        <button className="open-secondary full" type="button" onClick={() => setActiveStage("debug")} disabled={!selectedChecklist.length}>
          {t("Open Mismatch Lens")}
        </button>
      </aside>
    );
  }

  function renderPreviewFrame() {
    return (
      <div className="preview-frame-open">
        <div className="preview-header-open">
          <strong><Monitor size={19} /> {t("Preview Stage")}</strong>
          <span className={previewState.status}><i /> {t(previewState.status === "idle" ? "Ready" : previewState.status)}</span>
          <button type="button" onClick={runPreview} disabled={isBusy}>
            <Play size={16} />
            {t("Run and check")}
          </button>
        </div>
        <P5Preview code={code} runKey={runKey} onConsole={onConsole} onError={onPreviewError} />
      </div>
    );
  }

  function renderPreviewStep() {
    return (
      <section className="preview-stage-open room-panel">
        <div>
          {renderPreviewFrame()}
        </div>
        {renderChecklistTestPanel()}
      </section>
    );
  }

  function renderChangedStep() {
    return (
      <section className="room-panel changed-step-open">
        <span className="step-kicker">{t("What changed")}</span>
        <h1>{t("Your system grew.")}</h1>
        <p>{t(`This step added: ${selectedNode?.visibleBehavior ?? ""}`)}</p>
        <button className="open-primary" type="button" onClick={completeCurrentNode}>
          {t("Show System Growth Map")}
          <ArrowRight size={18} />
        </button>
      </section>
    );
  }

  function renderRoomContent() {
    if (roomStep === "story") return renderStoryStep();
    if (roomStep === "checks") return renderChecksStep();
    if (roomStep === "logic") return renderLogicStep();
    if (roomStep === "build") return renderBuildStep();
    if (roomStep === "preview") return renderPreviewStep();
    return renderChangedStep();
  }

  function renderMilestoneRoom() {
    if (!project || !selectedNode) return renderSystemTrailCanvas();
    return (
      <section className="room-screen">
        {renderProjectMapCompact()}
        <main className="room-main">
          <button className="back-link-open" type="button" onClick={() => setActiveStage("trail")}>
            <ArrowLeft size={16} />
            {t("Back to System Trail")}
          </button>
          {renderRoomContent()}
        </main>
        {renderRoomStepper()}
      </section>
    );
  }

  function renderPreviewStage() {
    if (!project || !selectedNode) return renderSystemTrailCanvas();
    return (
      <section className="preview-screen-open">
        {renderProjectRail()}
        <main>
          <header className="screen-heading">
            <h1>{t("Preview Stage")}</h1>
            <p>{t("Try the step, then check your own list.")}</p>
          </header>
          <div className="preview-workbench-open">
            {renderPreviewFrame()}
            {renderChecklistTestPanel()}
          </div>
        </main>
        <aside className="next-panel-open">
          <h2>{t("Current milestone focus")}</h2>
          <p>{t(selectedNode.title)}</p>
          <button className="open-secondary full" type="button" onClick={() => setActiveStage("room")}>
            {t("Back to room")}
          </button>
          <QuietAICard>Look first, then decide. Yes, not yet, and I'm not sure are all useful answers.</QuietAICard>
        </aside>
      </section>
    );
  }

  function renderMismatchLens() {
    if (!project || !selectedNode) return renderSystemTrailCanvas();
    const expected = missingCheck?.text ?? selectedNode.visibleBehavior;
    return (
      <section className="debug-screen-open">
        {renderProjectRail()}
        <main>
          <header className="screen-heading">
            <h1>{t("Mismatch Lens")}</h1>
            <p>{t("Compare what you expected with what actually happened. No panic, just observation.")}</p>
          </header>
          <section className="mismatch-card-open">
            <article className="wanted-open">
              <span><Check size={22} /></span>
              <h2>{t("I wanted")}</h2>
              <p>{t(expected)}</p>
            </article>
            <div className="lens-divider-open"><Eye size={40} /></div>
            <article className="saw-open">
              <span><CircleHelp size={22} /></span>
              <h2>{t("I saw")}</h2>
              <textarea value={t(observedBehavior)} onChange={(event) => setObservedBehavior(event.target.value)} aria-label={t("Observed behavior")} />
            </article>
          </section>
          <section className="missing-check-open">
            <div>
              <strong>{t("The missing check")}</strong>
              <p>{t(expected)}</p>
            </div>
            <button className="open-primary" type="button" onClick={diagnoseMismatch} disabled={isBusy}>
              {t("Find one small fix")}
            </button>
          </section>
          {debugDiagnosis && (
            <section className="try-fix-open">
              <Lightbulb size={22} />
              <div>
                <h2>{t("Try this fix")}</h2>
                <p>{t(debugDiagnosis.fixSummary)}</p>
                <ul>
                  {debugDiagnosis.choices.map((choice) => (
                    <li key={choice.label} className={choice.isLikely ? "likely" : ""}>{t(choice.label)}</li>
                  ))}
                </ul>
              </div>
              <button className="open-primary" type="button" onClick={buildPatch} disabled={isBusy}>
                {t("Apply small fix")}
              </button>
            </section>
          )}
        </main>
        <aside className="next-panel-open">
          <h2>{t("Choose your next build step")}</h2>
          {project.systemTrail.nodes.map((node) => {
            const Icon = nodeIcon(node);
            return (
              <button key={node.id} type="button" className={node.id === selectedNode.id ? "active" : ""} onClick={() => selectNode(node)}>
                <Icon size={20} />
                <span>{t(node.title)}</span>
              </button>
            );
          })}
          <QuietAICard>The missing check points to the smallest fix.</QuietAICard>
        </aside>
      </section>
    );
  }

  function renderGrowthMap() {
    if (!project || !selectedNode) return renderSystemTrailCanvas();
    const chain = selectedPlan?.logicChain ?? [];
    return (
      <section className="growth-screen-open">
        {renderProjectRail()}
        <main>
          <header className="screen-heading">
            <h1>{t("Your system grew.")}</h1>
            <p>{t(`This step added a visible connection: ${selectedNode.visibleBehavior}`)}</p>
          </header>
          <section className="growth-map-open">
            {(chain.length ? chain : [
              { id: "one", title: selectedNode.title, detail: selectedNode.visibleBehavior, role: "system-output" as const },
              { id: "two", title: "User sees change", detail: "The result is visible.", role: "user-understanding" as const }
            ]).map((step, index) => (
              <article key={step.id} className={index === Math.min(2, chain.length - 1) ? "new" : ""}>
                {index === Math.min(2, chain.length - 1) && <em>{isZh ? "新增" : "New"}</em>}
                <span>{index + 1}</span>
                <strong>{t(step.title)}</strong>
                <p>{t(step.detail)}</p>
                <Check size={19} />
              </article>
            ))}
          </section>
          <section className="growth-summary-open">
            <Sparkles size={32} />
            <div>
              <h2>{t("Great work. Your system is clearer now.")}</h2>
              <p>{t("You can go back to the trail and choose the next visible part.")}</p>
            </div>
            <button className="open-primary" type="button" onClick={() => {
              if (nextNode) setSelectedNodeId(nextNode.id);
              setActiveStage("trail");
            }}>
              {t("Return to System Trail")}
              <ArrowRight size={17} />
            </button>
          </section>
        </main>
        <aside className="next-panel-open">
          <h2>{t("Choose your next build step")}</h2>
          {[nextNode, ...(project.systemTrail.nodes.filter((node) => node.status === "planned").slice(0, 2))].filter(Boolean).map((node) => {
            const realNode = node as SystemNode;
            const Icon = nodeIcon(realNode);
            return (
              <button key={realNode.id} type="button" onClick={() => {
                setSelectedNodeId(realNode.id);
                setActiveStage("trail");
              }}>
                <Icon size={22} />
                <span>{t(realNode.title)}</span>
                <ArrowRight size={16} />
              </button>
            );
          })}
          <QuietAICard>Small steps make big systems.</QuietAICard>
        </aside>
      </section>
    );
  }

  return (
    <main className="open-studio-shell" lang={uiLanguage === "zh" ? "zh-CN" : "en"} data-language={uiLanguage}>
      {renderAppBar()}
      <section className="open-studio-main">
        {activeStage === "idea" && renderIdeaStudio()}
        {activeStage === "understanding" && renderGoalUnderstanding()}
        {activeStage === "coplan" && renderCoPlanningStudio()}
        {activeStage === "draft" && renderDraftTrailReview()}
        {activeStage === "first" && renderFirstMilestoneChoice()}
        {activeStage === "trail" && renderSystemTrailCanvas()}
        {activeStage === "room" && renderMilestoneRoom()}
        {activeStage === "preview" && renderPreviewStage()}
        {activeStage === "debug" && renderMismatchLens()}
        {activeStage === "growth" && renderGrowthMap()}
        {error && (
          <p className="open-error">
            <X size={16} />
            {t(error)}
          </p>
        )}
      </section>
    </main>
  );
}
