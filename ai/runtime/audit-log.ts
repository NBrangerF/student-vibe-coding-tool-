import type { AgentPlanningStatus, AgentSkillName } from "../schemas/planning";

export interface AgentAuditEvent {
  id: string;
  skill: AgentSkillName;
  state: AgentPlanningStatus;
  inputSummary: string;
  outputSummary: string;
  validationResult: "passed" | "failed" | "fallback";
  createdAt: string;
}

export function createAgentAuditEvent(input: Omit<AgentAuditEvent, "id" | "createdAt">): AgentAuditEvent {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...input
  };
}
