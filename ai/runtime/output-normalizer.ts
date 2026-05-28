import type { CandidateSystemPart, DraftSystemTrail } from "@/lib/types";
import { normalizeSystemPartTitle } from "../schemas/system-trail";

export function normalizeCandidateSystemPart(part: CandidateSystemPart): CandidateSystemPart {
  return {
    ...part,
    title: normalizeSystemPartTitle(part.title),
    visibleBehavior: part.visibleBehavior.replace(/\s+/g, " ").trim().slice(0, 180),
    systemRole: part.systemRole.replace(/\s+/g, " ").trim().slice(0, 48)
  };
}

export function normalizeDraftSystemTrail(trail: DraftSystemTrail): DraftSystemTrail {
  return {
    nodes: trail.nodes.map((node, index) => ({
      ...node,
      title: normalizeSystemPartTitle(node.title),
      visibleBehavior: node.visibleBehavior.replace(/\s+/g, " ").trim().slice(0, 180),
      systemRole: node.systemRole.replace(/\s+/g, " ").trim().slice(0, 48),
      order: index + 1
    })),
    edges: trail.edges
  };
}
