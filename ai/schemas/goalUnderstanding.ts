import type { GoalUnderstanding, PlanningLens } from "@/lib/types";

export const PLANNING_LENSES: PlanningLens[] = [
  "game-interaction",
  "creative-transform-tool",
  "task-organizer",
  "story-world",
  "simulation",
  "learning-helper-agent",
  "content-website",
  "data-dashboard",
  "communication-tool",
  "physical-computing",
  "generic-custom-system"
];

export function isPlanningLens(value: unknown): value is PlanningLens {
  return typeof value === "string" && PLANNING_LENSES.includes(value as PlanningLens);
}

export function validateGoalUnderstanding(understanding: GoalUnderstanding): string[] {
  const errors: string[] = [];
  if (!understanding.projectTitle?.trim()) errors.push("projectTitle is required");
  if (!understanding.originalIdea?.trim()) errors.push("originalIdea is required");
  if (!understanding.learnerFacingRestatement?.trim()) errors.push("learnerFacingRestatement is required");
  if (!isPlanningLens(understanding.planningLens)) errors.push("planningLens is invalid");
  if (!["high", "medium", "low"].includes(understanding.confidence)) errors.push("confidence is invalid");
  if (!understanding.recommendedCoPlanningStrategy?.firstQuestionFocus) errors.push("firstQuestionFocus is required");
  if (!understanding.recommendedCoPlanningStrategy?.questionSequence?.length) errors.push("questionSequence is required");
  if (!understanding.goalContract) {
    errors.push("goalContract is required");
  } else {
    if (!understanding.goalContract.learnerGoal?.trim()) errors.push("goalContract.learnerGoal is required");
    if (!understanding.goalContract.engagementAnchor) errors.push("goalContract.engagementAnchor is required");
    for (const field of ["primaryObject", "actor", "coreMechanic", "endState"] as const) {
      if (understanding.goalReadiness?.readyForConfirmation && !understanding.goalContract[field]) {
        errors.push(`goalContract.${field} is required when ready`);
      }
    }
  }
  if (!understanding.goalReadiness) {
    errors.push("goalReadiness is required");
  } else {
    if (typeof understanding.goalReadiness.readyForConfirmation !== "boolean") errors.push("goalReadiness.readyForConfirmation is required");
    if (!Array.isArray(understanding.goalReadiness.missingFields)) errors.push("goalReadiness.missingFields is required");
    if (understanding.goalReadiness.missingEngagementFields && !Array.isArray(understanding.goalReadiness.missingEngagementFields)) {
      errors.push("goalReadiness.missingEngagementFields is invalid");
    }
    if (!["high", "medium", "low"].includes(understanding.goalReadiness.confidence)) errors.push("goalReadiness.confidence is invalid");
    if (!understanding.goalReadiness.readyForConfirmation && !understanding.goalReadiness.nextQuestion) {
      errors.push("goalReadiness.nextQuestion is required when not ready");
    }
  }
  if (understanding.planningLens === "creative-transform-tool") {
    const words = [
      understanding.primaryObject,
      understanding.desiredChange,
      understanding.likelyOutput,
      understanding.systemGrammar?.input,
      understanding.systemGrammar?.transformation,
      understanding.systemGrammar?.output
    ].join(" ");
    if (!/drawing|image|style|preview/i.test(words)) {
      errors.push("creative-transform-tool must include drawing/image/style grammar");
    }
  }
  return errors;
}
