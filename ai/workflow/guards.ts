import type { CandidateSystemPart, DraftSystemTrail, PlanningSession } from "@/lib/types";
import { containsForbiddenImplementationLanguage, selectedCandidateParts, validateDraftSystemTrail, validateVisibleSystemPart } from "../schemas/system-trail";

export function assertNoImplementationTaskLanguage(text: string): void {
  if (containsForbiddenImplementationLanguage(text)) {
    throw new Error("Output uses implementation-task language instead of visible system behavior.");
  }
}

export function assertCandidatePartsAreVisible(parts: CandidateSystemPart[]): void {
  const errors = parts.flatMap((part) => validateVisibleSystemPart(part));
  if (errors.length) {
    throw new Error(errors.join("; "));
  }
}

export function assertSelectedPartsExist(parts: CandidateSystemPart[]): void {
  if (selectedCandidateParts(parts).length === 0) {
    throw new Error("At least one selected system part is required before assembling a draft trail.");
  }
}

export function assertDraftTrailIsReviewable(draftTrail: DraftSystemTrail): void {
  const errors = validateDraftSystemTrail(draftTrail);
  if (errors.length) {
    throw new Error(errors.join("; "));
  }
}

export function assertDraftReviewedBeforeConfirm(session: PlanningSession): void {
  if (session.status !== "draft_trail_reviewed") {
    throw new Error("Review the draft trail before confirming the System Trail.");
  }
}
