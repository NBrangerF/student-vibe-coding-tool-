import type { AgentSkillName } from "../schemas/planning";

export const AGENT_PROMPT_PATH = "ai/agent.md";

export const SKILL_PROMPT_PATHS: Record<Exclude<AgentSkillName, "confirm-system-trail">, string> = {
  "goal-intake": "ai/skills/goal-intake.md",
  "clarify-finished-artifact": "ai/skills/clarify-finished-artifact.md",
  "clarify-first-user-action": "ai/skills/clarify-first-user-action.md",
  "clarify-first-system-response": "ai/skills/clarify-first-system-response.md",
  "generate-candidate-system-parts": "ai/skills/generate-candidate-system-parts.md",
  "refine-candidate-system-part": "ai/skills/refine-candidate-system-part.md",
  "assemble-draft-system-trail": "ai/skills/assemble-draft-system-trail.md",
  "review-draft-system-trail": "ai/skills/review-draft-system-trail.md",
  "suggest-first-milestone": "ai/skills/suggest-first-milestone.md"
};

export function buildCompactSkillContext(context: unknown): string {
  return JSON.stringify(context, null, 2).slice(0, 4000);
}

export function composeSkillPrompt(input: {
  agentPrompt: string;
  skillPrompt: string;
  compactContext: unknown;
}): string {
  return [
    input.agentPrompt.trim(),
    "",
    input.skillPrompt.trim(),
    "",
    "Compact context:",
    buildCompactSkillContext(input.compactContext)
  ].join("\n");
}
