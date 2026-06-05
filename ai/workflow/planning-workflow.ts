import type { PlanningSession, Project } from "@/lib/types";
import type { AgentAllowedAction, AgentPlanningStatus, AgentSkillName, AgentUiInstruction } from "../schemas/planning";

export interface PlanningWorkflowStep {
  status: AgentPlanningStatus;
  skill: AgentSkillName;
  allowedActions: AgentAllowedAction[];
  uiInstruction: AgentUiInstruction;
}

const workflowSteps: Record<AgentPlanningStatus, PlanningWorkflowStep> = {
  IDEA_CAPTURED: {
    status: "IDEA_CAPTURED",
    skill: "goal-understanding",
    allowedActions: ["confirm-understanding", "revise-understanding", "answer-goal-question"],
    uiInstruction: {
      surface: "goal-understanding",
      quietAI: "First I will check what you want to make."
    }
  },
  GOAL_UNDERSTANDING_GENERATED: {
    status: "GOAL_UNDERSTANDING_GENERATED",
    skill: "goal-understanding",
    allowedActions: ["confirm-understanding", "revise-understanding", "answer-goal-question"],
    uiInstruction: {
      surface: "goal-understanding",
      quietAI: "Check my understanding before planning."
    }
  },
  GOAL_UNDERSTANDING_CONFIRMED: {
    status: "GOAL_UNDERSTANDING_CONFIRMED",
    skill: "adaptive-co-planning-question",
    allowedActions: ["answer-question"],
    uiInstruction: {
      surface: "question",
      quietAI: "Now we can ask one project-specific question at a time."
    }
  },
  GOAL_UNDERSTANDING_NEEDS_CLARIFICATION: {
    status: "GOAL_UNDERSTANDING_NEEDS_CLARIFICATION",
    skill: "goal-understanding",
    allowedActions: ["confirm-understanding", "revise-understanding", "answer-goal-question"],
    uiInstruction: {
      surface: "goal-understanding",
      quietAI: "One more detail will help the questions fit your idea."
    }
  },
  FINISHED_ARTIFACT_CLARIFIED: {
    status: "FINISHED_ARTIFACT_CLARIFIED",
    skill: "clarify-first-user-action",
    allowedActions: ["answer-question"],
    uiInstruction: {
      surface: "question",
      quietAI: "The first action becomes the entrance to your system."
    }
  },
  FIRST_ACTION_CLARIFIED: {
    status: "FIRST_ACTION_CLARIFIED",
    skill: "clarify-first-system-response",
    allowedActions: ["answer-question"],
    uiInstruction: {
      surface: "question",
      quietAI: "Now we connect the action to something visible."
    }
  },
  FIRST_RESPONSE_CLARIFIED: {
    status: "FIRST_RESPONSE_CLARIFIED",
    skill: "generate-candidate-system-parts",
    allowedActions: ["select-parts", "edit-parts"],
    uiInstruction: {
      surface: "candidate-parts",
      quietAI: "These are possible parts, not the final trail."
    }
  },
  CANDIDATE_PARTS_GENERATED: {
    status: "CANDIDATE_PARTS_GENERATED",
    skill: "generate-candidate-system-parts",
    allowedActions: ["select-parts", "edit-parts"],
    uiInstruction: {
      surface: "candidate-parts",
      quietAI: "Choose what belongs in your trail."
    }
  },
  PARTS_SELECTED_OR_EDITED: {
    status: "PARTS_SELECTED_OR_EDITED",
    skill: "assemble-draft-system-trail",
    allowedActions: ["assemble-draft"],
    uiInstruction: {
      surface: "candidate-parts",
      quietAI: "Your selected parts can now become a draft."
    }
  },
  DRAFT_TRAIL_CREATED: {
    status: "DRAFT_TRAIL_CREATED",
    skill: "review-draft-system-trail",
    allowedActions: ["review-draft"],
    uiInstruction: {
      surface: "draft-review",
      quietAI: "This is still a draft. You confirm the system."
    }
  },
  DRAFT_TRAIL_REVIEWED: {
    status: "DRAFT_TRAIL_REVIEWED",
    skill: "suggest-first-milestone",
    allowedActions: ["choose-first-milestone"],
    uiInstruction: {
      surface: "first-milestone",
      quietAI: "A good first step should be small and easy to test."
    }
  },
  FIRST_MILESTONE_SELECTED: {
    status: "FIRST_MILESTONE_SELECTED",
    skill: "confirm-system-trail",
    allowedActions: ["confirm-trail"],
    uiInstruction: {
      surface: "first-milestone",
      quietAI: "Now the reviewed trail can become your confirmed system."
    }
  },
  SYSTEM_TRAIL_CONFIRMED: {
    status: "SYSTEM_TRAIL_CONFIRMED",
    skill: "confirm-system-trail",
    allowedActions: [],
    uiInstruction: {
      surface: "confirmed-trail",
      quietAI: "Your System Trail is ready. Build one part at a time."
    }
  }
};

export function planningStatusFromSession(session?: PlanningSession | null, project?: Project | null): AgentPlanningStatus {
  if (!session) return "IDEA_CAPTURED";
  if (project?.status === "trail_confirmed" || session.status === "completed") return "SYSTEM_TRAIL_CONFIRMED";
  if (session.status === "draft_trail_reviewed") return "DRAFT_TRAIL_REVIEWED";
  if (session.status === "draft_trail_created") return "DRAFT_TRAIL_CREATED";
  if (session.status === "parts_selected") return "PARTS_SELECTED_OR_EDITED";
  if (session.status === "system_response_clarified") {
    return session.candidateParts.length > 0 ? "CANDIDATE_PARTS_GENERATED" : "FIRST_RESPONSE_CLARIFIED";
  }
  if (session.status === "first_action_clarified") return "FIRST_ACTION_CLARIFIED";
  if (session.status === "outcome_clarified") return "FINISHED_ARTIFACT_CLARIFIED";
  if (session.status === "goal_understanding_confirmed") return "GOAL_UNDERSTANDING_CONFIRMED";
  if (session.status === "goal_understanding_needs_clarification") return "GOAL_UNDERSTANDING_NEEDS_CLARIFICATION";
  return "GOAL_UNDERSTANDING_GENERATED";
}

export function getPlanningWorkflowStep(status: AgentPlanningStatus): PlanningWorkflowStep {
  return workflowSteps[status];
}

export function getAllowedPlanningActions(status: AgentPlanningStatus): AgentAllowedAction[] {
  return [...workflowSteps[status].allowedActions];
}

export function getSkillForPlanningStatus(status: AgentPlanningStatus): AgentSkillName {
  return workflowSteps[status].skill;
}

export function isPlanningActionAllowed(status: AgentPlanningStatus, action: AgentAllowedAction): boolean {
  return workflowSteps[status].allowedActions.includes(action);
}

export function assertPlanningActionAllowed(status: AgentPlanningStatus, action: AgentAllowedAction): void {
  if (!isPlanningActionAllowed(status, action)) {
    throw new Error(`Action "${action}" is not allowed while planning status is ${status}.`);
  }
}
