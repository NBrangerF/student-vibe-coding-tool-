import { describe, expect, it } from "vitest";
import type { CandidateSystemPart, DraftSystemTrail, PlanningSession } from "@/lib/types";
import { validateAgentSkillOutput } from "../runtime/schema-validator";
import type { SkillResult } from "../schemas/planning";
import { draftTrailToSystemTrail } from "../schemas/system-trail";
import { assertDraftReviewedBeforeConfirm, assertSelectedPartsExist } from "./guards";
import {
  assertPlanningActionAllowed,
  getAllowedPlanningActions,
  getSkillForPlanningStatus,
  planningStatusFromSession
} from "./planning-workflow";

const baseSession: PlanningSession = {
  id: "planning-test",
  projectId: "project-test",
  idea: "I want to make a pet adventure game.",
  status: "started",
  responses: [],
  candidateParts: [],
  createdAt: "2026-05-23T00:00:00.000Z",
  updatedAt: "2026-05-23T00:00:00.000Z"
};

const parts: CandidateSystemPart[] = [
  {
    id: "pet-appears",
    title: "Pet appears",
    visibleBehavior: "The player sees their pet.",
    systemRole: "entry",
    selected: true,
    source: "ai-suggested"
  },
  {
    id: "pet-reacts",
    title: "Pet reacts",
    visibleBehavior: "The pet responds to the player's choice.",
    systemRole: "feedback",
    selected: true,
    source: "student-edited"
  }
];

const draftTrail: DraftSystemTrail = {
  nodes: [
    {
      id: "pet-appears",
      title: "Pet appears",
      visibleBehavior: "The player sees their pet.",
      systemRole: "entry",
      order: 1,
      status: "draft",
      source: "student-chosen"
    },
    {
      id: "pet-reacts",
      title: "Pet reacts",
      visibleBehavior: "The pet responds to the player's choice.",
      systemRole: "feedback",
      order: 2,
      status: "draft",
      source: "student-edited"
    }
  ],
  edges: [{ from: "pet-appears", to: "pet-reacts", type: "sequence" }]
};

describe("P0 agent planning workflow", () => {
  it("maps a started planning session to goal understanding before questions", () => {
    expect(planningStatusFromSession(baseSession)).toBe("GOAL_UNDERSTANDING_GENERATED");
    expect(getSkillForPlanningStatus("GOAL_UNDERSTANDING_GENERATED")).toBe("goal-understanding");
    expect(getAllowedPlanningActions("GOAL_UNDERSTANDING_GENERATED")).toEqual(["confirm-understanding", "revise-understanding", "answer-goal-question"]);
  });

  it("does not allow candidate generation before first response is clarified", () => {
    expect(() => assertPlanningActionAllowed("GOAL_UNDERSTANDING_GENERATED", "answer-question")).toThrow(/not allowed/);
    expect(() => assertPlanningActionAllowed("GOAL_UNDERSTANDING_GENERATED", "select-parts")).toThrow(/not allowed/);
    expect(() => assertPlanningActionAllowed("FIRST_ACTION_CLARIFIED", "select-parts")).toThrow(/not allowed/);
  });

  it("allows candidate selection only after candidate parts exist in the workflow", () => {
    expect(getAllowedPlanningActions("CANDIDATE_PARTS_GENERATED")).toEqual(["select-parts", "edit-parts"]);
  });

  it("requires selected parts before draft assembly", () => {
    expect(() => assertSelectedPartsExist(parts)).not.toThrow();
    expect(() => assertSelectedPartsExist(parts.map((part) => ({ ...part, selected: false })))).toThrow(/selected/);
  });

  it("blocks confirmation until the draft has been reviewed", () => {
    expect(() => assertDraftReviewedBeforeConfirm({ ...baseSession, status: "draft_trail_created" })).toThrow(/Review/);
    expect(() => assertDraftReviewedBeforeConfirm({ ...baseSession, status: "draft_trail_reviewed" })).not.toThrow();
  });

  it("preserves provenance when converting a draft trail to a confirmed system trail", () => {
    const systemTrail = draftTrailToSystemTrail(draftTrail, "pet-appears");
    expect(systemTrail.nodes).toHaveLength(2);
    expect(systemTrail.nodes[0]).toMatchObject({ id: "pet-appears", status: "current" });
    expect(systemTrail.nodes[1]).toMatchObject({ id: "pet-reacts", status: "planned" });
  });

  it("rejects implementation-task language in skill output", () => {
    const result: SkillResult = {
      skill: "generate-candidate-system-parts",
      candidateParts: [
        {
          id: "bad",
          title: "Create function",
          visibleBehavior: "The project uses a function.",
          systemRole: "implementation",
          selected: true,
          source: "ai-suggested",
          whyItBelongs: "It writes code."
        },
        ...parts.map((part) => ({ ...part, source: "ai-suggested" as const, whyItBelongs: "It is visible." })),
        {
          id: "happiness",
          title: "Happiness changes",
          visibleBehavior: "The pet's happiness changes.",
          systemRole: "state",
          selected: true,
          source: "ai-suggested",
          whyItBelongs: "It is visible."
        }
      ],
      quietAI: "Choose what belongs in your trail."
    };
    expect(validateAgentSkillOutput(result).ok).toBe(false);
  });
});
