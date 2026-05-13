export type ProjectStatus = "draft" | "path_generated" | "in_progress" | "complete";
export type MilestoneStatus = "not_started" | "in_progress" | "needs_fix" | "done";
export type BuildEventType =
  | "idea_captured"
  | "path_generated"
  | "milestone_planned"
  | "patch_proposed"
  | "patch_applied"
  | "preview_run"
  | "debug_started"
  | "checkpoint_created"
  | "mini_explain_answered";
export type AiEngineSource = "openai" | "fallback";

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  originalIdea: string;
  projectType: "p5_game_animation";
  currentMilestoneId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  order: number;
  title: string;
  visibleOutput: string;
  concepts: string[];
  doneChecklist: string[];
  status: MilestoneStatus;
}

export interface BuildEvent {
  id: string;
  projectId: string;
  milestoneId?: string;
  type: BuildEventType;
  summary: string;
  studentAction: string;
  aiAction: string;
  createdAt: string;
}

export interface Checkpoint {
  id: string;
  projectId: string;
  milestoneId: string;
  name: string;
  filesSnapshot: Record<string, string>;
  previewState: PreviewState;
  createdAt: string;
}

export interface LearningTrace {
  projectId: string;
  conceptsTouched: string[];
  bugsFixed: string[];
  miniExplainAnswers: string[];
  decisionsMade: string[];
}

export interface ClarificationQuestion {
  id: string;
  prompt: string;
  options: string[];
  allowFreeText: boolean;
}

export interface GoalInterviewTurn {
  questionId: string;
  prompt: string;
  answer: string;
  createdAt: string;
}

export type PathMapNodeType = "goal" | "experience" | "mechanic" | "milestone" | "later";
export type PathMapNodeStatus = "known" | "draft" | "open";

export interface ProjectPathMapNode {
  id: string;
  type: PathMapNodeType;
  status: PathMapNodeStatus;
  label: string;
  detail: string;
  evidence: string;
}

export interface ProjectPathMapEdge {
  from: string;
  to: string;
  label: string;
}

export interface ProjectPathMap {
  title: string;
  summary: string;
  confidence: number;
  nodes: ProjectPathMapNode[];
  edges: ProjectPathMapEdge[];
  openQuestions: string[];
  updatedAt: string;
}

export interface GoalInterviewReadiness {
  answeredCount: number;
  requiredCount: number;
  canGeneratePath: boolean;
  missing: string[];
}

export interface GoalInterviewResponse {
  engineSource: AiEngineSource;
  reflectedGoal: string;
  progressLabel: string;
  nextQuestion?: ClarificationQuestion | null;
  turns: GoalInterviewTurn[];
  pathMap: ProjectPathMap;
  readiness: GoalInterviewReadiness;
  assistantMessage: string;
}

export interface ClarificationResponse {
  reflectedIdea: string;
  suggestedTitle: string;
  questions: ClarificationQuestion[];
  interview: GoalInterviewResponse;
}

export interface ProjectPathResponse {
  engineSource: AiEngineSource;
  project: Project;
  milestones: Milestone[];
  starterCode: string;
  pathMap: ProjectPathMap;
  assistantMessage: string;
}

export interface PredictionQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface MilestonePlanResponse {
  milestone: Milestone;
  logicSketch: string[];
  predictionQuestion: PredictionQuestion;
  buildPlan: string[];
}

export interface PatchResponse {
  code: string;
  changeSummary: string[];
  changedFiles: string[];
  checkpointName: string;
  miniExplainQuestion: PredictionQuestion;
  learningTraceDelta: Pick<LearningTrace, "conceptsTouched" | "decisionsMade">;
  validation: {
    scopedToMilestone: boolean;
    noFullProjectGeneration: boolean;
    reason: string;
  };
}

export interface PreviewState {
  status: "idle" | "running" | "error";
  runCount: number;
  console: string[];
  error?: string;
  lastRunAt?: string;
}

export interface DebugChoice {
  label: string;
  explanation: string;
  isLikely: boolean;
}

export interface DebugDiagnosisResponse {
  visibleBehavior: string;
  failedChecklistItem: string;
  choices: DebugChoice[];
  likelyCause: string;
  fixSummary: string;
}
