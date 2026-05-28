import type { CandidateSystemPart, DraftSystemNode, DraftSystemTrail, SystemEdge, SystemNode, SystemTrail } from "@/lib/types";

export const FORBIDDEN_SYSTEM_PART_TERMS = [
  "api",
  "component",
  "conditional",
  "create function",
  "function",
  "implement",
  "state logic",
  "variable",
  "write code",
  "write conditional"
];

const forbiddenRegex = new RegExp(`\\b(${FORBIDDEN_SYSTEM_PART_TERMS.map((term) => term.replace(/\s+/g, "\\s+")).join("|")})\\b`, "i");

export function containsForbiddenImplementationLanguage(value: string): boolean {
  return forbiddenRegex.test(value);
}

export function normalizeSystemPartTitle(value: string): string {
  return value
    .replace(/\bimplement\b/gi, "")
    .replace(/\bcreate function\b/gi, "")
    .replace(/\bwrite code\b/gi, "")
    .replace(/\bcomponent\b/gi, "part")
    .replace(/\bAPI\b/g, "connection")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

export function validateVisibleSystemPart(part: Pick<CandidateSystemPart | SystemNode | DraftSystemNode, "title" | "visibleBehavior" | "systemRole">): string[] {
  const errors: string[] = [];
  if (!part.title.trim()) errors.push("title is required");
  if (!part.visibleBehavior.trim()) errors.push("visibleBehavior is required");
  if (!part.systemRole.trim()) errors.push("systemRole is required");
  if (containsForbiddenImplementationLanguage(`${part.title} ${part.visibleBehavior} ${part.systemRole}`)) {
    errors.push("system part uses implementation-task language");
  }
  if (part.title.length > 56) errors.push("title is too long");
  if (part.visibleBehavior.length > 180) errors.push("visibleBehavior is too long");
  return errors;
}

export function validateDraftSystemTrail(trail: DraftSystemTrail): string[] {
  const errors: string[] = [];
  if (!Array.isArray(trail.nodes) || trail.nodes.length < 1) errors.push("draft trail needs at least one node");
  if (trail.nodes.length > 7) errors.push("draft trail has too many nodes");
  for (const node of trail.nodes) {
    errors.push(...validateVisibleSystemPart(node).map((error) => `${node.id}: ${error}`));
    if (!node.source) errors.push(`${node.id}: source is required`);
  }
  return errors;
}

export function selectedCandidateParts(parts: CandidateSystemPart[]): CandidateSystemPart[] {
  return parts.filter((part) => part.selected);
}

export function draftTrailToSystemTrail(draftTrail: DraftSystemTrail, selectedFirstNodeId: string): SystemTrail {
  const nodes: SystemNode[] = draftTrail.nodes
    .filter((node) => node.status !== "removed")
    .map((node) => ({
      id: node.id,
      title: node.title,
      visibleBehavior: node.visibleBehavior,
      systemRole: node.systemRole,
      order: node.order,
      status: node.id === selectedFirstNodeId ? "current" : "planned"
    }));
  const allowedIds = new Set(nodes.map((node) => node.id));
  const edges: SystemEdge[] = draftTrail.edges.filter((edge) => allowedIds.has(edge.from) && allowedIds.has(edge.to));
  return { nodes, edges };
}
