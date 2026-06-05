export type ProjectStatus = "draft" | "planning" | "trail_generated" | "trail_confirmed" | "in_progress" | "complete";
export type SystemNodeStatus = "planned" | "current" | "building" | "completed" | "blocked";
export type SystemEdgeType = "sequence" | "dependency" | "feedback-loop";
export type ChecklistStatus = "unchecked" | "yes" | "not-yet" | "not-sure";
export type ChecklistFeedbackTag = "clear" | "too-vague" | "missing-step";
export type ChecklistSource = "student" | "ai-suggested";
export type AiEngineSource = "openai" | "fallback" | "local-gate";
export type PlanningLens =
  | "game-interaction"
  | "creative-transform-tool"
  | "task-organizer"
  | "story-world"
  | "simulation"
  | "learning-helper-agent"
  | "content-website"
  | "data-dashboard"
  | "communication-tool"
  | "physical-computing"
  | "generic-custom-system";
export type ConfidenceLevel = "high" | "medium" | "low";
export type SystemGrammarSlot =
  | "actor"
  | "primary-object"
  | "input"
  | "transformation"
  | "output"
  | "feedback"
  | "state"
  | "progression"
  | "save-share"
  | "boundary";
export type PlanningSessionStatus =
  | "started"
  | "goal_understanding_generated"
  | "goal_understanding_confirmed"
  | "goal_understanding_needs_clarification"
  | "outcome_clarified"
  | "first_action_clarified"
  | "system_response_clarified"
  | "parts_selected"
  | "draft_trail_created"
  | "draft_trail_reviewed"
  | "completed";
export type PlanningResponseSource = "choice" | "free-input" | "not-sure";
export type CandidateSystemPartSource = "ai-suggested" | "student-created" | "student-edited";
export type DraftSystemNodeSource = "ai-suggested" | "student-chosen" | "student-edited";
export type DraftSystemNodeStatus = "draft" | "selected-first" | "removed";

export interface MilestoneSuggestion {
  id: string;
  title: string;
  before: string;
  after: string;
  rationale?: string;
}

export interface SystemNode {
  id: string;
  title: string;
  visibleBehavior: string;
  systemRole: string;
  status: SystemNodeStatus;
  order: number;
  dependencies?: string[];
  suggestedMilestones?: MilestoneSuggestion[];
}

export interface SystemEdge {
  from: string;
  to: string;
  type?: SystemEdgeType;
}

export interface SystemTrail {
  nodes: SystemNode[];
  edges: SystemEdge[];
}

export interface Project {
  id: string;
  title: string;
  originalIdea: string;
  shortDescription?: string;
  currentFocusNodeId?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  systemTrail: SystemTrail;
}

export interface GoalUnderstanding {
  projectTitle: string;
  originalIdea: string;
  learnerFacingRestatement: string;
  planningLens: PlanningLens;
  confidence: ConfidenceLevel;
  primaryObject: string | null;
  desiredChange: string | null;
  likelyOutput: string | null;
  userActor: string | null;
  firstPossibleAction: string | null;
  systemResponseHypothesis: string | null;
  systemGrammar: {
    actor?: string | null;
    primaryObject?: string | null;
    input?: string | null;
    transformation?: string | null;
    output?: string | null;
    feedback?: string | null;
    state?: string | null;
    progression?: string | null;
    saveShare?: string | null;
    boundary?: string | null;
  };
  ambiguityFlags: string[];
  safetyOrBoundaryNotes: string[];
  recommendedCoPlanningStrategy: {
    firstQuestionFocus:
      | "artifact-outcome"
      | "first-user-action"
      | "input-source"
      | "transformation"
      | "output-preview"
      | "system-boundary";
    questionSequence: string[];
  };
  quietAI: string;
  goalContract?: GoalContract;
  goalReadiness?: GoalReadiness;
}

export type GoalContractField = "learnerGoal" | "primaryObject" | "actor" | "coreMechanic" | "endState";

export interface GoalContract {
  learnerGoal: string;
  primaryObject: string | null;
  actor: string | null;
  coreMechanic: string | null;
  endState: string | null;
}

export interface GoalClarificationQuestion {
  id: string;
  prompt: string;
  choices: PlanningChoice[];
  allowFreeText: boolean;
  allowNotSure: boolean;
  targets: GoalContractField[];
}

export interface GoalReadiness {
  readyForConfirmation: boolean;
  missingFields: GoalContractField[];
  confidence: ConfidenceLevel;
  rationale: string;
  nextQuestion: GoalClarificationQuestion | null;
}

export interface PlanningChoice {
  id: string;
  label: string;
  detail?: string;
  visibleBehavior?: string;
  fillsSlot?: SystemGrammarSlot;
  systemRole?: string;
}

export interface PlanningQuestion {
  id: "finished-artifact" | "first-user-action" | "first-system-response" | "system-parts";
  title: string;
  prompt: string;
  quietAiNote: string;
  choices: PlanningChoice[];
  allowFreeText: boolean;
  allowNotSure: boolean;
  allowMultiple: boolean;
  boundaryNote?: string;
}

export interface PlanningResponse {
  id: string;
  questionId: PlanningQuestion["id"];
  answer: string;
  source: PlanningResponseSource;
  createdAt: string;
}

export interface CandidateSystemPart {
  id: string;
  title: string;
  visibleBehavior: string;
  systemRole: string;
  selected: boolean;
  source: CandidateSystemPartSource;
}

export interface DraftSystemNode {
  id: string;
  title: string;
  visibleBehavior: string;
  systemRole: string;
  order: number;
  status: DraftSystemNodeStatus;
  source: DraftSystemNodeSource;
}

export interface DraftSystemTrail {
  nodes: DraftSystemNode[];
  edges: SystemEdge[];
}

export interface PlanningSession {
  id: string;
  projectId: string;
  idea: string;
  status: PlanningSessionStatus;
  responses: PlanningResponse[];
  candidateParts: CandidateSystemPart[];
  goalClarificationTurns?: GoalClarificationTurn[];
  goalUnderstanding?: GoalUnderstanding;
  draftTrail?: DraftSystemTrail;
  createdAt: string;
  updatedAt: string;
}

export interface GoalClarificationTurn {
  id: string;
  questionId: string;
  prompt: string;
  answer: string;
  source: PlanningResponseSource;
  targets: GoalContractField[];
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  source: ChecklistSource;
  status?: ChecklistStatus;
  feedbackTag?: ChecklistFeedbackTag;
}

export type BuildEventType =
  | "idea_captured"
  | "trail_generated"
  | "node_selected"
  | "checklist_drafted"
  | "logic_planned"
  | "patch_proposed"
  | "patch_applied"
  | "preview_run"
  | "debug_started"
  | "system_grew";

export interface BuildEvent {
  id: string;
  projectId: string;
  nodeId?: string;
  type: BuildEventType;
  summary: string;
  studentAction: string;
  aiAction: string;
  createdAt: string;
}

export interface PreviewState {
  status: "idle" | "running" | "error";
  runCount: number;
  console: string[];
  error?: string;
  lastRunAt?: string;
}

export interface Checkpoint {
  id: string;
  projectId: string;
  nodeId: string;
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
  projectPreview: Project;
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
  starterCode: string;
  assistantMessage: string;
}

export interface PlanningStartResponse {
  engineSource: AiEngineSource;
  project: Project;
  planningSession: PlanningSession;
  goalUnderstanding: GoalUnderstanding;
  currentQuestion?: PlanningQuestion | null;
  starterCode: string;
  assistantMessage: string;
}

export interface PlanningUnderstandingResponse {
  engineSource: AiEngineSource;
  project: Project;
  planningSession: PlanningSession;
  goalUnderstanding: GoalUnderstanding;
  currentQuestion?: PlanningQuestion | null;
  assistantMessage: string;
}

export interface PlanningAnswerResponse {
  engineSource: AiEngineSource;
  planningSession: PlanningSession;
  currentQuestion?: PlanningQuestion;
  draftPreviewNodes: string[];
  assistantMessage: string;
}

export interface DraftTrailResponse {
  engineSource: AiEngineSource;
  planningSession: PlanningSession;
  draftTrail: DraftSystemTrail;
  assistantMessage: string;
}

export interface ConfirmedTrailResponse {
  engineSource: AiEngineSource;
  project: Project;
  planningSession: PlanningSession;
  assistantMessage: string;
}

export interface PredictionQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface LogicChainStep {
  id: string;
  title: string;
  detail: string;
  role: "user-action" | "system-change" | "system-output" | "user-understanding";
}

export interface MilestonePlanResponse {
  node: SystemNode;
  story: {
    before: string;
    after: string;
  };
  logicChain: LogicChainStep[];
  predictionQuestion: PredictionQuestion;
  buildPlan: string[];
}

export interface ChecklistFeedbackItem {
  text: string;
  reason: string;
}

export interface ChecklistFeedbackResponse {
  engineSource: AiEngineSource;
  goodAndCheckable: ChecklistFeedbackItem[];
  tooVague: ChecklistFeedbackItem[];
  missingStep: ChecklistFeedbackItem[];
  improvedChecklist: string[];
  assistantMessage: string;
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

// Legacy path-map types are kept only for older helper components that are no
// longer part of the primary studio flow.
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
