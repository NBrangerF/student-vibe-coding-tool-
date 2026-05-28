import type { SkillResult } from "../schemas/planning";
import { validateSkillResult, type SkillValidationResult } from "../schemas/skill-results";
import { containsForbiddenImplementationLanguage } from "../schemas/system-trail";

function collectText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(collectText).join(" ");
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(collectText).join(" ");
  }
  return "";
}

export function validateAgentSkillOutput(result: SkillResult): SkillValidationResult {
  const validation = validateSkillResult(result);
  const text = collectText(result);
  if (containsForbiddenImplementationLanguage(text)) {
    return {
      ok: false,
      errors: [...validation.errors, "output contains forbidden implementation language"]
    };
  }
  return validation;
}
