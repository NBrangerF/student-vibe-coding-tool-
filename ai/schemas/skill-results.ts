import type {
  CandidateSystemPartsResult,
  DraftSystemTrailResult,
  FirstMilestoneRecommendationResult,
  GoalUnderstandingResult,
  GoalIntakeResult,
  PlanningQuestionResult,
  SkillResult
} from "./planning";
import { validateGoalUnderstanding } from "./goalUnderstanding";
import { validateDraftSystemTrail, validateVisibleSystemPart } from "./system-trail";

export interface SkillValidationResult {
  ok: boolean;
  errors: string[];
}

function hasString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateSkillResult(result: SkillResult): SkillValidationResult {
  const errors: string[] = [];

  if (!result || typeof result !== "object") {
    return { ok: false, errors: ["result must be an object"] };
  }

  if (!hasString(result.skill)) errors.push("skill is required");

  if (result.skill === "goal-intake") {
    const intake = result as GoalIntakeResult;
    if (!hasString(intake.projectTitle)) errors.push("projectTitle is required");
    if (!hasString(intake.ideaRestatement)) errors.push("ideaRestatement is required");
    if (intake.nextActionLabel !== "Start co-planning") errors.push("nextActionLabel must be Start co-planning");
  }

  if (result.skill === "goal-understanding") {
    const understanding = (result as GoalUnderstandingResult).goalUnderstanding;
    if (!understanding) errors.push("goalUnderstanding is required");
    if (understanding) errors.push(...validateGoalUnderstanding(understanding));
  }

  if (
    result.skill === "adaptive-co-planning-question" ||
    result.skill === "clarify-finished-artifact" ||
    result.skill === "clarify-first-user-action" ||
    result.skill === "clarify-first-system-response"
  ) {
    const question = (result as PlanningQuestionResult).question;
    if (!question) errors.push("question is required");
    if (question && question.choices.length < 2) errors.push("question needs at least two choices");
    if (question && !question.allowFreeText) errors.push("question must allow free input");
    if (question && !question.allowNotSure) errors.push("question must allow not sure");
  }

  if (result.skill === "generate-candidate-system-parts") {
    const candidateResult = result as CandidateSystemPartsResult;
    if (candidateResult.candidateParts.length < 4) errors.push("candidate parts need at least four parts");
    if (candidateResult.candidateParts.length > 7) errors.push("candidate parts can have at most seven parts");
    for (const part of candidateResult.candidateParts) {
      errors.push(...validateVisibleSystemPart(part).map((error) => `${part.id}: ${error}`));
      if (part.source !== "ai-suggested") errors.push(`${part.id}: generated candidates must be ai-suggested`);
    }
  }

  if (result.skill === "assemble-draft-system-trail") {
    errors.push(...validateDraftSystemTrail((result as DraftSystemTrailResult).draftTrail));
  }

  if (result.skill === "suggest-first-milestone") {
    const recommendationResult = result as FirstMilestoneRecommendationResult;
    if (recommendationResult.recommendations.length < 1) errors.push("at least one recommendation is required");
    if (recommendationResult.recommendations.length > 3) errors.push("at most three recommendations are allowed");
  }

  return { ok: errors.length === 0, errors };
}
