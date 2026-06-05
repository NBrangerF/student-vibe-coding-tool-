import type { CandidateSystemPart, DraftSystemTrail, PlanningQuestion, PlanningResponseSource, PlanningSession, Project } from "@/lib/types";
import {
  answerPlanningQuestion,
  buildGoalClarification,
  confirmGoalUnderstanding,
  confirmDraftTrail,
  createDraftTrailFromCandidates,
  getPlanningQuestion,
  reviewDraftTrail,
  startCoPlanning
} from "@/lib/mvp-engine";
import type {
  AgentAllowedAction,
  AgentRuntimeResponse,
  CandidateSystemPartsResult,
  DraftReviewResult,
  DraftSystemTrailResult,
  FirstMilestoneRecommendation,
  FirstMilestoneRecommendationResult,
  GoalIntakeResult,
  GoalUnderstandingResult,
  PlanningQuestionResult,
  PlanningSessionAdvanceInput,
  PlanningSessionStartInput,
  SkillResult
} from "../schemas/planning";
import { draftTrailToSystemTrail, selectedCandidateParts } from "../schemas/system-trail";
import {
  assertPlanningActionAllowed,
  getAllowedPlanningActions,
  getPlanningWorkflowStep,
  planningStatusFromSession
} from "../workflow/planning-workflow";
import { assertDraftReviewedBeforeConfirm, assertSelectedPartsExist } from "../workflow/guards";

function response<T extends SkillResult>(input: {
  session: PlanningSession;
  project?: Project;
  data: T;
}): AgentRuntimeResponse<T> {
  const status = planningStatusFromSession(input.session, input.project);
  const step = getPlanningWorkflowStep(status);
  return {
    sessionId: input.session.id,
    status,
    allowedActions: getAllowedPlanningActions(status),
    uiInstruction: step.uiInstruction,
    data: input.data,
    session: input.session,
    project: input.project
  };
}

function titleFromIdea(idea: string): string {
  return idea
    .replace(/^i want to make\s+/i, "")
    .replace(/[.?!]+$/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ") || "My Project";
}

function goalIntakeResult(project: Project): GoalIntakeResult {
  return {
    skill: "goal-intake",
    projectTitle: project.title || titleFromIdea(project.originalIdea),
    ideaRestatement: `You want to make: ${project.originalIdea}`,
    artifactGuess: project.title || null,
    nextActionLabel: "Start co-planning",
    quietAI: "Nice idea. First we will make the system visible, then choose one small part to build."
  };
}

function goalUnderstandingResult(project: Project): GoalUnderstandingResult {
  const goalUnderstanding = buildGoalClarification(project.originalIdea);
  return {
    skill: "goal-understanding",
    goalUnderstanding,
    quietAI: goalUnderstanding.quietAI
  };
}

function questionResult(question: PlanningQuestion): PlanningQuestionResult {
  const skillByQuestion: Record<PlanningQuestion["id"], PlanningQuestionResult["skill"]> = {
    "finished-artifact": "adaptive-co-planning-question",
    "first-user-action": "adaptive-co-planning-question",
    "first-system-response": "adaptive-co-planning-question",
    "system-parts": "adaptive-co-planning-question"
  };
  return {
    skill: skillByQuestion[question.id],
    question,
    quietAI: question.quietAiNote
  };
}

function candidatePartsResult(parts: CandidateSystemPart[]): CandidateSystemPartsResult {
  return {
    skill: "generate-candidate-system-parts",
    candidateParts: parts.map((part) => ({
      ...part,
      whyItBelongs: "It helps make one visible part of the learner's system."
    })),
    quietAI: "These are possible parts of your system. You can keep, change, remove, or add parts."
  };
}

function draftTrailResult(draftTrail: DraftSystemTrail): DraftSystemTrailResult {
  return {
    skill: "assemble-draft-system-trail",
    draftTrail,
    reviewPrompt: "This is a first version. What would you like to change?",
    quietAI: "This is still a draft. You confirm the system before building."
  };
}

function firstMilestoneRecommendations(draftTrail: DraftSystemTrail): FirstMilestoneRecommendation[] {
  return draftTrail.nodes
    .filter((node) => node.status !== "removed")
    .slice(0, 3)
    .map((node) => ({
      nodeId: node.id,
      title: node.title,
      whyGoodFirst: "It creates visible progress and is small enough to test.",
      before: `The system does not show "${node.title}" yet.`,
      after: node.visibleBehavior
    }));
}

export function startAgentPlanningSession(input: PlanningSessionStartInput): {
  project: Project;
  planningSession: PlanningSession;
  response: AgentRuntimeResponse<GoalIntakeResult>;
} {
  const started = startCoPlanning(input.learnerIdea);
  return {
    project: started.project,
    planningSession: started.planningSession,
    response: response({
      project: started.project,
      session: started.planningSession,
      data: goalUnderstandingResult(started.project)
    })
  };
}

export function advanceAgentPlanningSession(input: PlanningSessionAdvanceInput): AgentRuntimeResponse {
  const status = planningStatusFromSession(input.session, input.project);
  assertPlanningActionAllowed(status, input.action);

  if (input.action === "confirm-understanding" || input.action === "revise-understanding") {
    if (!input.project) throw new Error("project is required");
    const confirmed = confirmGoalUnderstanding({
      project: input.project,
      session: input.session,
      action: input.action === "confirm-understanding" ? "confirm" : "revise",
      extraDetail: String(input.payload?.extraDetail ?? "")
    });
    if (input.action === "revise-understanding" && input.payload?.extraDetail) {
      return response({
        project: confirmed.project,
      session: {
          ...confirmed.planningSession,
          status: confirmed.planningSession.status
        },
        data: {
          skill: "goal-understanding",
          goalUnderstanding: confirmed.goalUnderstanding,
          quietAI: confirmed.goalUnderstanding.quietAI
        }
      });
    }
    return response({
      project: confirmed.project,
      session: confirmed.planningSession,
      data: confirmed.currentQuestion
        ? questionResult(confirmed.currentQuestion)
        : {
          skill: "goal-understanding",
          goalUnderstanding: confirmed.goalUnderstanding,
          quietAI: confirmed.assistantMessage
        }
    });
  }

  if (input.action === "answer-goal-question") {
    if (!input.project) throw new Error("project is required");
    const answered = confirmGoalUnderstanding({
      project: input.project,
      session: input.session,
      action: "answer-goal-question",
      answer: String(input.payload?.answer ?? ""),
      question: input.payload?.question as never,
      source: input.payload?.source as never
    });
    return response({
      project: answered.project,
      session: answered.planningSession,
      data: {
        skill: "goal-understanding",
        goalUnderstanding: answered.goalUnderstanding,
        quietAI: answered.assistantMessage
      }
    });
  }

  if (input.action === "answer-question") {
    const question = getPlanningQuestion(input.session);
    const questionId = (input.payload?.questionId as PlanningQuestion["id"] | undefined) ?? question?.id;
    const answer = String(input.payload?.answer ?? "").trim();
    const source = (input.payload?.source as PlanningResponseSource | undefined) ?? "choice";
    if (!questionId || !answer) throw new Error("questionId and answer are required");

    const answered = answerPlanningQuestion({ session: input.session, questionId, answer, source });
    if (answered.planningSession.candidateParts.length > 0) {
      return response({
        project: input.project,
        session: answered.planningSession,
        data: candidatePartsResult(answered.planningSession.candidateParts)
      });
    }
    if (answered.currentQuestion) {
      return response({
        project: input.project,
        session: answered.planningSession,
        data: questionResult(answered.currentQuestion)
      });
    }
    return response({
      project: input.project,
      session: answered.planningSession,
      data: candidatePartsResult(answered.planningSession.candidateParts)
    });
  }

  if (input.action === "select-parts" || input.action === "edit-parts") {
    const candidateParts = (input.payload?.candidateParts as CandidateSystemPart[] | undefined) ?? input.session.candidateParts;
    assertSelectedPartsExist(candidateParts);
    const updatedSession: PlanningSession = {
      ...input.session,
      status: "parts_selected",
      candidateParts,
      updatedAt: new Date().toISOString()
    };
    return response({
      project: input.project,
      session: updatedSession,
      data: candidatePartsResult(candidateParts)
    });
  }

  if (input.action === "assemble-draft") {
    assertSelectedPartsExist(input.session.candidateParts);
    const draft = createDraftTrailFromCandidates(input.session);
    return response({
      project: input.project,
      session: draft.planningSession,
      data: draftTrailResult(draft.draftTrail)
    });
  }

  if (input.action === "review-draft") {
    const draftTrail = (input.payload?.draftTrail as DraftSystemTrail | undefined) ?? input.session.draftTrail;
    if (!draftTrail) throw new Error("draftTrail is required");
    const reviewed = reviewDraftTrail(input.session, draftTrail);
    const review: DraftReviewResult = {
      skill: "review-draft-system-trail",
      responseType: "confirm-ready",
      message: "Looks ready to choose a first build step.",
      suggestedActions: ["Choose your first build step", "Rename a part", "Move a part"]
    };
    return response({
      project: input.project,
      session: reviewed.planningSession,
      data: review
    });
  }

  if (input.action === "choose-first-milestone") {
    const draftTrail = input.session.draftTrail;
    if (!draftTrail) throw new Error("draftTrail is required");
    const data: FirstMilestoneRecommendationResult = {
      skill: "suggest-first-milestone",
      recommendations: firstMilestoneRecommendations(draftTrail),
      quietAI: "A good first step should be small and easy to test."
    };
    return response({ project: input.project, session: input.session, data });
  }

  const draftTrail = (input.payload?.draftTrail as DraftSystemTrail | undefined) ?? input.session.draftTrail;
  const project = input.project;
  const selectedFirstNodeId = String(input.payload?.selectedFirstNodeId ?? "");
  if (!project || !draftTrail || !selectedFirstNodeId) throw new Error("project, draftTrail, and selectedFirstNodeId are required");
  assertDraftReviewedBeforeConfirm(input.session);
  const confirmed = confirmDraftTrail({ project, session: input.session, draftTrail, selectedFirstNodeId });
  const systemTrail = draftTrailToSystemTrail(draftTrail, selectedFirstNodeId);
  return response({
    project: confirmed.project,
    session: confirmed.planningSession,
    data: {
      skill: "confirm-system-trail",
      project: confirmed.project,
      systemTrail,
      selectedFirstNodeId,
      quietAI: "Your System Trail is ready. Build one part at a time."
    }
  });
}

export function selectedPartCount(session: PlanningSession): number {
  return selectedCandidateParts(session.candidateParts).length;
}
