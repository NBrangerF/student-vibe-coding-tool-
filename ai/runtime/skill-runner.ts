import type { AgentAuditEvent } from "./audit-log";
import { createAgentAuditEvent } from "./audit-log";
import { validateAgentSkillOutput } from "./schema-validator";
import type { AgentPlanningStatus, AgentSkillName, SkillResult } from "../schemas/planning";

export interface SkillRunnerInput {
  state: AgentPlanningStatus;
  skill: AgentSkillName;
  inputSummary: string;
  callModel: () => Promise<SkillResult>;
  fallback: () => SkillResult;
  auditEvents?: AgentAuditEvent[];
}

export interface SkillRunnerResult {
  result: SkillResult;
  engineSource: "openai" | "fallback";
  attempts: number;
  auditEvents: AgentAuditEvent[];
  validationErrors: string[];
}

export async function runSkillWithSchemaGuard(input: SkillRunnerInput): Promise<SkillRunnerResult> {
  const auditEvents = input.auditEvents ? [...input.auditEvents] : [];
  const validationErrors: string[] = [];

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const result = await input.callModel();
      const validation = validateAgentSkillOutput(result);
      if (validation.ok) {
        auditEvents.push(createAgentAuditEvent({
          skill: input.skill,
          state: input.state,
          inputSummary: input.inputSummary,
          outputSummary: result.skill,
          validationResult: "passed"
        }));
        return { result, engineSource: "openai", attempts: attempt, auditEvents, validationErrors };
      }
      validationErrors.push(...validation.errors);
      auditEvents.push(createAgentAuditEvent({
        skill: input.skill,
        state: input.state,
        inputSummary: input.inputSummary,
        outputSummary: validation.errors.join("; "),
        validationResult: "failed"
      }));
    } catch (error) {
      validationErrors.push(error instanceof Error ? error.message : "model call failed");
    }
  }

  const fallbackResult = input.fallback();
  auditEvents.push(createAgentAuditEvent({
    skill: input.skill,
    state: input.state,
    inputSummary: input.inputSummary,
    outputSummary: fallbackResult.skill,
    validationResult: "fallback"
  }));

  return {
    result: fallbackResult,
    engineSource: "fallback",
    attempts: 2,
    auditEvents,
    validationErrors
  };
}
