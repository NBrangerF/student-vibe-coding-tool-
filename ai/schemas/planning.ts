import type {
  CandidateSystemPart,
  DraftSystemTrail,
  PlanningChoice,
  GoalUnderstanding,
  PlanningQuestion,
  PlanningSession,
  Project,
  SystemTrail
} from "@/lib/types";

export type AgentPlanningStatus =
  | "IDEA_CAPTURED"
  | "GOAL_UNDERSTANDING_GENERATED"
  | "GOAL_UNDERSTANDING_CONFIRMED"
  | "GOAL_UNDERSTANDING_NEEDS_CLARIFICATION"
  | "FINISHED_ARTIFACT_CLARIFIED"
  | "FIRST_ACTION_CLARIFIED"
  | "FIRST_RESPONSE_CLARIFIED"
  | "CANDIDATE_PARTS_GENERATED"
  | "PARTS_SELECTED_OR_EDITED"
  | "DRAFT_TRAIL_CREATED"
  | "DRAFT_TRAIL_REVIEWED"
  | "FIRST_MILESTONE_SELECTED"
  | "SYSTEM_TRAIL_CONFIRMED";

export type AgentSkillName =
  | "goal-understanding"
  | "goal-intake"
  | "adaptive-co-planning-question"
  | "clarify-finished-artifact"
  | "clarify-first-user-action"
  | "clarify-first-system-response"
  | "generate-candidate-system-parts"
  | "refine-candidate-system-part"
  | "assemble-draft-system-trail"
  | "review-draft-system-trail"
  | "suggest-first-milestone"
  | "confirm-system-trail";

export type AgentAllowedAction =
  | "confirm-understanding"
  | "revise-understanding"
  | "answer-question"
  | "select-parts"
  | "edit-parts"
  | "assemble-draft"
  | "review-draft"
  | "choose-first-milestone"
  | "confirm-trail";

export type AgentUiSurface =
  | "idea"
  | "goal-understanding"
  | "question"
  | "candidate-parts"
  | "draft-review"
  | "first-milestone"
  | "confirmed-trail";

export type SystemPartSource = "ai-suggested" | "student-chosen" | "student-edited" | "student-created";

export interface AgentUiInstruction {
  surface: AgentUiSurface;
  quietAI: string;
}

export interface GoalIntakeResult {
  skill: "goal-intake";
  projectTitle: string;
  ideaRestatement: string;
  artifactGuess: string | null;
  nextActionLabel: "Start co-planning";
  quietAI: string;
}

export interface GoalUnderstandingResult {
  skill: "goal-understanding";
  goalUnderstanding: GoalUnderstanding;
  quietAI: string;
}

export interface PlanningQuestionResult {
  skill:
    | "adaptive-co-planning-question"
    | "clarify-finished-artifact"
    | "clarify-first-user-action"
    | "clarify-first-system-response";
  question: PlanningQuestion;
  quietAI: string;
}

export interface CandidateSystemPartWithReason extends CandidateSystemPart {
  whyItBelongs: string;
}

export interface CandidateSystemPartsResult {
  skill: "generate-candidate-system-parts";
  candidateParts: CandidateSystemPartWithReason[];
  quietAI: string;
}

export interface RefinedCandidateSystemPartResult {
  skill: "refine-candidate-system-part";
  part: CandidateSystemPart;
  quietAI: string;
}

export interface DraftSystemTrailResult {
  skill: "assemble-draft-system-trail";
  draftTrail: DraftSystemTrail;
  reviewPrompt: string;
  quietAI: string;
}

export interface DraftReviewResult {
  skill: "review-draft-system-trail";
  responseType: "edit-suggestion" | "confirm-ready" | "clarifying-question";
  message: string;
  suggestedActions: string[];
}

export interface FirstMilestoneRecommendation {
  nodeId: string;
  title: string;
  whyGoodFirst: string;
  before: string;
  after: string;
}

export interface FirstMilestoneRecommendationResult {
  skill: "suggest-first-milestone";
  recommendations: FirstMilestoneRecommendation[];
  quietAI: string;
}

export interface ConfirmedSystemTrailResult {
  skill: "confirm-system-trail";
  project: Project;
  systemTrail: SystemTrail;
  selectedFirstNodeId: string;
  quietAI: string;
}

export type SkillResult =
  | GoalUnderstandingResult
  | GoalIntakeResult
  | PlanningQuestionResult
  | CandidateSystemPartsResult
  | RefinedCandidateSystemPartResult
  | DraftSystemTrailResult
  | DraftReviewResult
  | FirstMilestoneRecommendationResult
  | ConfirmedSystemTrailResult;

export interface AgentRuntimeResponse<TData extends SkillResult = SkillResult> {
  sessionId: string;
  status: AgentPlanningStatus;
  allowedActions: AgentAllowedAction[];
  uiInstruction: AgentUiInstruction;
  data: TData;
  session?: PlanningSession;
  project?: Project;
}

export interface PlanningSessionStartInput {
  learnerIdea: string;
  learnerAgeBand?: "G3-5" | "G6-9" | "G3-9";
}

export interface PlanningSessionAdvanceInput {
  session: PlanningSession;
  project?: Project;
  action: AgentAllowedAction;
  payload?: Record<string, unknown>;
}

export const AGENT_PLANNING_STATUS_ORDER: AgentPlanningStatus[] = [
  "IDEA_CAPTURED",
  "GOAL_UNDERSTANDING_GENERATED",
  "GOAL_UNDERSTANDING_CONFIRMED",
  "GOAL_UNDERSTANDING_NEEDS_CLARIFICATION",
  "FINISHED_ARTIFACT_CLARIFIED",
  "FIRST_ACTION_CLARIFIED",
  "FIRST_RESPONSE_CLARIFIED",
  "CANDIDATE_PARTS_GENERATED",
  "PARTS_SELECTED_OR_EDITED",
  "DRAFT_TRAIL_CREATED",
  "DRAFT_TRAIL_REVIEWED",
  "FIRST_MILESTONE_SELECTED",
  "SYSTEM_TRAIL_CONFIRMED"
];

export const PLANNING_QUESTION_SKILLS: PlanningQuestionResult["skill"][] = [
  "adaptive-co-planning-question",
  "clarify-finished-artifact",
  "clarify-first-user-action",
  "clarify-first-system-response"
];

export function isPlanningQuestionSkill(skill: AgentSkillName): skill is PlanningQuestionResult["skill"] {
  return PLANNING_QUESTION_SKILLS.includes(skill as PlanningQuestionResult["skill"]);
}

export function planningChoiceFromLabel(id: string, label: string, detail?: string): PlanningChoice {
  return { id, label, detail };
}
