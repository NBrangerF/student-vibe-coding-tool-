"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  Bug,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Download,
  Eye,
  Flag,
  Gamepad2,
  Headphones,
  Home,
  Layers3,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Play,
  RefreshCcw,
  RotateCcw,
  Send,
  Share2,
  Sparkles,
  Trophy,
  Wand2,
  Workflow
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { postJson } from "@/lib/api-client";
import { P5Preview } from "@/components/p5-preview";
import { ProjectPathMapView } from "@/components/project-path-map";
import { STARTER_CODE } from "@/lib/p5-code";
import {
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

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        activeStage?: AppStage;
        idea?: string;
        project?: Project;
        goalInterview?: GoalInterviewResponse;
        pathMap?: ProjectPathMap;
        milestones?: Milestone[];
        selectedMilestoneId?: string;
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
      if (parsed.code) setCode(parsed.code);
      if (parsed.changeSummary) setChangeSummary(parsed.changeSummary);
      if (parsed.checkpoints) setCheckpoints(parsed.checkpoints);
      if (parsed.trace) setTrace(parsed.trace);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
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
        code,
        changeSummary,
        checkpoints,
        trace
      })
    );
  }, [activeStage, idea, goalInterview, pathMap, project, milestones, selectedMilestoneId, code, changeSummary, checkpoints, trace]);

  const selectedMilestone = useMemo(
    () => milestones.find((milestone) => milestone.id === selectedMilestoneId) ?? milestones[0],
    [milestones, selectedMilestoneId]
  );
  const nextMilestone = nextMilestoneAfter(milestones, selectedMilestone);
  const currentChecklist = selectedMilestone?.doneChecklist ?? [];
  const completedChecklistCount = currentChecklist.filter((item) => checklistState[item]).length;
  const allChecklistDone = currentChecklist.length > 0 && completedChecklistCount === currentChecklist.length;
  const firstUncheckedChecklistItem = currentChecklist.find((item) => !checklistState[item]) || currentChecklist[0];
  const currentStepIsDone = Boolean(selectedMilestone?.status === "done" || allChecklistDone);
  const activeCheckpoint = checkpoints[checkpoints.length - 1];
  const projectTitle = project?.title ?? pathMap?.title ?? "School Quiz Game";

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
      setChecklistState(Object.fromEntries(response.milestone.doneChecklist.map((item) => [item, false])));
      setMilestones((items) => updateMilestone(items, selectedMilestone.id, { status: "in_progress" }));
      setActiveStage("milestones");
      appendAssistantLog(`Now focus only on: ${response.milestone.title}. Look at the plan, then make one change.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Milestone planning failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleApplyPatch() {
    if (!selectedMilestone || !project) return;
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
    setChecklistState((state) => ({ ...state, [item]: !state[item] }));
  }

  function handleCompleteMilestone() {
    if (!selectedMilestone) return;
    setMilestones((items) => updateMilestone(items, selectedMilestone.id, { status: "done" }));
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
    return (
      <section className="dashboard-stage">
        <div className="dashboard-main">
          <div className="hero-copy">
            <h1>Let's turn your idea into something great.</h1>
            <p>Start with your idea. We will help you break it down into steps.</p>
          </div>

          <section className="idea-card">
            <div className="idea-card-heading">
              <span className="soft-icon">
                <Sparkles size={24} />
              </span>
              <h2>What do you want to make?</h2>
            </div>
            <textarea
              className="idea-input"
              id="idea"
              maxLength={500}
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              aria-label="Project idea"
            />
            <span className="char-count">{idea.length}/500</span>

            <div className="helper-area">
              <strong>Not sure where to start? Let AI help you clarify.</strong>
              <div className="helper-grid">
                {helperChoices.map((choice) => {
                  const Icon = choice.icon;
                  return (
                    <button
                      type="button"
                      className="helper-choice"
                      key={choice.label}
                      onClick={() => setIdea(choice.label === "Describe it myself" ? DEFAULT_IDEA : `${DEFAULT_IDEA} It should start with ${choice.label.toLowerCase()}.`)}
                    >
                      <span>
                        <Icon size={20} />
                      </span>
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button className="primary-button start-button" type="button" onClick={handleStartGoalInterview} disabled={isBusy || !idea.trim()}>
              <Sparkles size={18} />
              Start planning with AI
            </button>
          </section>

          <section className="starter-section">
            <div className="section-title-row">
              <h2>Example project starters</h2>
              <button type="button" className="link-button">
                See more starters <ArrowRight size={15} />
              </button>
            </div>
            <div className="starter-grid">
              {starterCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className={`starter-card ${card.tone}`} key={card.title}>
                    <span className="starter-icon">
                      <Icon size={24} />
                    </span>
                    <strong>{card.title}</strong>
                    <p>{card.description}</p>
                    <button type="button" onClick={() => setIdea(card.idea)}>
                      Use this starter
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="dashboard-side">
          <section className="how-card">
            <h2>How it works</h2>
            <div className="how-steps">
              {howItWorks.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div className="how-step" key={step.title}>
                    <span className="how-icon">
                      <Icon size={22} />
                    </span>
                    <i>{index + 1}</i>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
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
      </section>
    );
  }

  function renderFlowchart() {
    const canGeneratePath = Boolean(goalInterview?.readiness.canGeneratePath);

    return (
      <section className="stage-view flowchart-stage">
        <div className="stage-header">
          <div>
            <h1>{projectTitle}</h1>
            <p>Map the flow of your game. Add, move, and connect steps to plan your experience.</p>
          </div>
          <div className="stage-actions">
            <button className="secondary-button" type="button" disabled={!project}>
              <Share2 size={16} />
              Share
            </button>
            <button className="secondary-button" type="button" disabled>
              Export <ChevronDown size={16} />
            </button>
            <button className="secondary-button accent" type="button" onClick={() => project && setActiveStage("milestones")} disabled={!project}>
              <Play size={16} />
              Preview Flow
            </button>
          </div>
        </div>

        <div className="flowchart-layout">
          <div className="flowchart-main">
            <div className="ai-banner">
              <span>
                <Workflow size={22} />
              </span>
              <div>
                <strong>You + AI co-plan the flow.</strong>
                <p>Map paths through choices and free input. The map grows only after decisions are clear.</p>
              </div>
              <button type="button" className="link-button">
                Learn more
              </button>
            </div>
            <ProjectPathMapView pathMap={pathMap} />
          </div>

          <aside className="flowchart-side">
            <section className="question-card">
              <div className="card-title">
                <Sparkles size={18} />
                <h2>AI asks one question</h2>
              </div>
              {!goalInterview ? (
                <>
                  <p>Start with one small question. The map will grow as you answer.</p>
                  <button className="primary-button" type="button" onClick={handleStartGoalInterview} disabled={isBusy}>
                    Start asking
                  </button>
                </>
              ) : (
                <>
                  <div className="source-row">
                    <span>{goalInterview.engineSource === "openai" ? "AI is asking" : "Practice mode"}</span>
                    <strong>{goalInterview.progressLabel}</strong>
                  </div>
                  <p>{goalInterview.reflectedGoal}</p>
                  {goalInterview.nextQuestion ? (
                    <div className="question-block">
                      <span className="question-kicker">Question for you</span>
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
                    <p>Good, we have enough to start the first small step.</p>
                  )}
                  <button className="primary-button" type="button" onClick={handleGeneratePath} disabled={isBusy || !canGeneratePath}>
                    <Flag size={16} />
                    Start my path
                  </button>
                  {!canGeneratePath && (
                    <small>{goalInterview.readiness.requiredCount - goalInterview.readiness.answeredCount} more answer(s) before we build.</small>
                  )}
                </>
              )}
            </section>

            <section className="suggestion-card">
              <div className="card-title">
                <Sparkles size={18} />
                <h2>Map note</h2>
              </div>
              <button className="suggestion-option selected" type="button" disabled>
                <span>Recommended</span>
                {pathMap?.nodes.map((node, index) => (
                  <i key={node.id}>{index + 1}</i>
                ))}
              </button>
              <p>{canGeneratePath ? "You have enough choices. Start the first small step when you are ready." : "Answer the next question to grow the map."}</p>
              <ul>
                <li>Add a feedback step after the first question.</li>
                <li>Save high scores for a later step.</li>
              </ul>
            </section>

            <section className="mentor-card compact-card">
              <Headphones size={22} />
              <h2>Mentor Support</h2>
              <p>Stuck on the flow or unsure what's next?</p>
              <button type="button" className="secondary-button">
                Ask a mentor
              </button>
            </section>
          </aside>
        </div>
      </section>
    );
  }

  function renderMilestones() {
    return (
      <section className="stage-view milestone-stage">
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
            <button className="icon-button" type="button" disabled>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="build-grid">
          <aside className="build-left">
            <section className="panel">
              <div className="panel-header">
                <h2>Project flow</h2>
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
                <h2>Next tiny step</h2>
              </div>
              {selectedMilestone ? (
                <>
                  <strong>{selectedMilestone.title}</strong>
                  <p>{grade3Copy(selectedMilestone.visibleOutput)}</p>
                  <small>Small step · about 20-30 min</small>
                  <button className="primary-button" type="button" onClick={handlePlanMilestone} disabled={isBusy}>
                    <Check size={16} />
                    {milestonePlan ? "Refresh step plan" : "Plan this step"}
                  </button>
                </>
              ) : (
                <p>No milestone selected.</p>
              )}
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Done checklist</h2>
                <strong>{completedChecklistCount} / {currentChecklist.length || 0}</strong>
              </div>
              {currentChecklist.length === 0 ? (
                <p className="muted">Plan a step to see what to check.</p>
              ) : (
                <>
                  <div className="checklist">
                    {currentChecklist.map((item) => (
                      <label className="checkline" key={item}>
                        <input type="checkbox" checked={Boolean(checklistState[item])} onChange={() => handleChecklistToggle(item)} />
                        <span>{grade3Copy(item)}</span>
                      </label>
                    ))}
                  </div>
                  <button className="secondary-button" type="button" disabled={!allChecklistDone} onClick={handleCompleteMilestone}>
                    <Check size={16} />
                    This step is done
                  </button>
                </>
              )}
            </section>
          </aside>

          <section className="build-preview">
            <div className="panel preview-panel">
              <div className="panel-header">
                <div>
                  <h2>What you made</h2>
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
            {renderToolDrawer()}
          </section>

          <aside className="build-right">
            <section className="panel ai-companion">
              <div className="card-title">
                <Sparkles size={18} />
                <h2>AI helper</h2>
              </div>
              <div className="companion-tabs">
                <button className="active" type="button">
                  Plan
                </button>
                <button type="button" disabled>
                  Notes
                </button>
              </div>

              {!milestonePlan ? (
                <div className="empty-companion">
                  <p>Plan this step to see what we will make and one quick check.</p>
                  <button className="primary-button" type="button" onClick={handlePlanMilestone} disabled={!selectedMilestone || isBusy}>
                    <ListChecks size={16} />
                    Plan this step
                  </button>
                </div>
              ) : (
                <>
                  <div className="logic-sketch">
                    {milestonePlan.logicSketch.map((step, index) => (
                      <div className="logic-step" key={`${step}-${index}`}>
                        <span>{index + 1}</span>
                        <p>{step}</p>
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
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="primary-button" type="button" onClick={handleApplyPatch} disabled={isBusy || predictionAnswer === null}>
                    <Wand2 size={16} />
                    Make this change
                  </button>
                </>
              )}
            </section>

            <section className="panel ai-support">
              <h2>Help for this step</h2>
              <p>Use this when what you see does not match the checklist.</p>
              <button className="secondary-button" type="button" onClick={() => setActiveStage("preview")} disabled={!project}>
                <Bug size={16} />
                Fix what I see
              </button>
              <button className="secondary-button" type="button" onClick={handleSelectNextMilestone} disabled={!nextMilestone}>
                <ArrowRight size={16} />
                Pick next step
              </button>
              <div className="chat-input">
                <span>Ask about this step...</span>
                <Send size={18} />
              </div>
            </section>

            {miniExplain && (
              <section className="panel mini-explain">
                <div className="card-title">
                  <Sparkles size={18} />
                  <h2>Quick check</h2>
                </div>
                <strong>{miniExplain.prompt}</strong>
                <div className="option-list">
                  {miniExplain.options.map((option, index) => (
                    <button
                      className={`choice-button ${miniExplainAnswer === index ? "selected" : ""}`}
                      key={option}
                      type="button"
                      onClick={() => handleMiniExplainAnswer(index)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <button className="secondary-button" type="button" onClick={handleSelectNextMilestone} disabled={miniExplainAnswer === null}>
                  <ArrowRight size={16} />
                  Next step
                </button>
              </section>
            )}
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
          <section className="panel debug-preview-panel">
            <div className="panel-header">
            <h2>What I see</h2>
              <span className={`run-status ${previewState.status}`}>{previewState.status}</span>
            </div>
            <div className="preview-surface debug-preview-surface">
              <P5Preview code={code} runKey={runKey} onConsole={handleConsole} onError={handlePreviewError} />
            </div>
            <p className="muted">Try clicking the preview, then choose what is missing.</p>
          </section>

          <section className="debug-main-stack">
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
                      <span key={item} className={checklistState[item] ? "done" : ""}>
                        {checklistState[item] ? <Check size={14} /> : <CircleHelp size={14} />}
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

  const sidebarItems = [
    { stage: "dashboard" as const, label: "Projects", icon: Home },
    { stage: "flowchart" as const, label: "Map", icon: Workflow },
    { stage: "milestones" as const, label: "Steps", icon: Flag },
    { stage: "preview" as const, label: "Preview", icon: Eye },
    { stage: "preview" as const, label: "Help", icon: Headphones }
  ];

  return (
    <main className="gtm-shell">
      <aside className="gtm-sidebar">
        <div className="brand-lockup">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <strong>Goal-to-Milestone</strong>
        </div>

        <nav className="side-nav" aria-label="Workspace stages">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const enabled = item.label === "Mentor Support" ? Boolean(project) : canOpenStage(item.stage);
            const active = item.label === "Mentor Support" ? false : activeStage === item.stage;
            return (
              <button className={active ? "active" : ""} type="button" key={item.label} onClick={() => openStage(item.stage)} disabled={!enabled}>
                <Icon size={22} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <section className="sidebar-callout">
          <Sparkles size={20} />
          <h2>You and AI build it together.</h2>
          <p>Make choices, type your ideas, and we will help turn them into a plan.</p>
        </section>

        <button className="collapse-button" type="button" disabled>
          <ArrowLeft size={17} />
          Collapse
        </button>
      </aside>

      <header className="gtm-topbar">
        <nav className="top-tabs" aria-label="Primary">
          <button className="active" type="button">
            Dashboard
          </button>
          <button type="button" disabled>
            My Projects
          </button>
          <button type="button" disabled>
            Gallery
          </button>
          <button type="button" disabled>
            Resources
          </button>
        </nav>
        <div className="top-actions">
          <button className="ai-top-button" type="button" onClick={() => openStage(project ? "milestones" : "flowchart")} disabled={!goalInterview && !project}>
            <Sparkles size={18} />
            AI Assistant
          </button>
          <button className="icon-button notification" type="button" disabled>
            <Bell size={19} />
            <span>2</span>
          </button>
          <button className="secondary-button compact" type="button" onClick={handleResetWorkspace}>
            <RefreshCcw size={15} />
            New goal
          </button>
          <button className="icon-button" type="button" title="Roll back to latest checkpoint" onClick={() => activeCheckpoint && handleRollback(activeCheckpoint)} disabled={!activeCheckpoint}>
            <RotateCcw size={18} />
          </button>
          <div className="user-chip">
            <span>A</span>
            <div>
              <strong>Ava Johnson</strong>
              <small>Learner</small>
            </div>
            <ChevronDown size={15} />
          </div>
        </div>
      </header>

      <section className="gtm-content">
        {activeStage === "dashboard" && renderDashboard()}
        {activeStage === "flowchart" && renderFlowchart()}
        {activeStage === "milestones" && renderMilestones()}
        {activeStage === "preview" && renderPreviewDebug()}
        {error && <p className="floating-error">{error}</p>}
      </section>
    </main>
  );
}
