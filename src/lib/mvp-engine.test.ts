import { describe, expect, it } from "vitest";
import {
  answerPlanningQuestion,
  buildGoalClarification,
  confirmDraftTrail,
  createDraftTrailFromCandidates,
  createProjectFromIdea,
  createProjectPath,
  confirmGoalUnderstanding,
  generatePatch,
  inferGoalUnderstanding,
  generatePlanningChoices,
  generateSystemTrailFromIdea,
  logicChainForNode,
  planMilestone,
  reviewDraftTrail,
  reviewChecklist,
  startCoPlanning
} from "@/lib/mvp-engine";
import { ChecklistItem } from "@/lib/types";

const implementationWords = /implement|function|conditional|state logic|write code|create function/i;

describe("open-ended systems-first MVP engine", () => {
  it("captures an open-ended idea without immediately confirming a System Trail", () => {
    const project = createProjectFromIdea("I want to make a jumping arcade game.");

    expect(project.title).toBe("Jumping Arcade Game");
    expect(project.status).toBe("planning");
    expect(project.systemTrail.nodes).toHaveLength(0);
    expect(project.currentFocusNodeId).toBeUndefined();
  });

  it("can still create School Quiz as one optional fixture, not the product default", () => {
    const response = createProjectPath("I want to make a pet adventure game.");

    expect(response.project.title).toBe("Pet Adventure Game");
    expect(response.project.title === "School Quiz Game").toBe(false);
    expect(response.project.systemTrail.nodes).toHaveLength(5);
    expect(response.project.currentFocusNodeId).toBe(response.project.systemTrail.nodes[0].id);
  });

  it("keeps School Quiz Game as only one optional fixture", () => {
    const quiz = createProjectPath("I want to make a quiz game about my school.");
    const club = createProjectPath("I want to make an app for my club tasks.");

    expect(quiz.project.title).toBe("School Quiz Game");
    expect(club.project.title).toBe("Club Task App");
    expect(club.project.systemTrail.nodes.map((node) => node.title).join("|") === quiz.project.systemTrail.nodes.map((node) => node.title).join("|")).toBe(false);
  });

  it("generates co-planning choices from the learner idea", () => {
    const jumping = generatePlanningChoices("I want to make a jumping arcade game.", "first-user-action");
    const homework = generatePlanningChoices("I want to make a homework helper agent.", "finished-artifact");
    const generic = generatePlanningChoices("I want to make a weather mood thing.", "finished-artifact");

    expect(jumping.map((choice) => choice.label)).toContain("Tap to jump");
    expect(homework.map((choice) => choice.label)).toContain("Get hints instead of answers");
    expect(generic.map((choice) => choice.label)).toContain("Work with a main object");
  });

  it("understands drawing style ideas as creative transform tools", () => {
    const understanding = inferGoalUnderstanding("我想要做一个自动给我的 drawing 添加风格的软件");

    expect(understanding.planningLens).toBe("creative-transform-tool");
    expect(understanding.primaryObject).toBe("drawing");
    expect(understanding.desiredChange).toContain("style");
    expect(understanding.likelyOutput).toContain("styled");
  });

  it("does not mark an immature game idea ready for confirmation", () => {
    const understanding = buildGoalClarification("I want to make a game");

    expect(understanding.goalReadiness?.readyForConfirmation).toBe(false);
    expect(understanding.goalReadiness?.missingFields).toEqual(expect.arrayContaining(["coreMechanic", "endState"]));
    expect(["coreMechanic", "endState"]).toContain(understanding.goalReadiness?.nextQuestion?.targets[0]);
  });

  it("marks a specific pet-game goal ready when it has a mechanic and end state", () => {
    const understanding = buildGoalClarification("I want to make a pet game where feeding the pet changes happiness and the goal is to keep it happy for 3 days");

    expect(understanding.goalReadiness?.readyForConfirmation).toBe(true);
    expect(understanding.goalContract?.primaryObject).toBeTruthy();
    expect(understanding.goalContract?.coreMechanic).toBeTruthy();
    expect(understanding.goalContract?.endState).toBeTruthy();
  });

  it("asks for the main missing pieces when an idea is too vague", () => {
    const understanding = buildGoalClarification("I want to make something fun");

    expect(understanding.goalReadiness?.readyForConfirmation).toBe(false);
    expect(understanding.goalReadiness?.missingFields).toEqual(expect.arrayContaining(["primaryObject", "coreMechanic", "endState"]));
    expect(understanding.goalReadiness?.nextQuestion).toMatchObject({ id: "goal-primary-object" });
  });

  it("creates a ready goal contract for drawing style ideas", () => {
    const understanding = buildGoalClarification("我想要做一个自动给我的 drawing 添加风格的软件");

    expect(understanding.goalReadiness?.readyForConfirmation).toBe(true);
    expect(understanding.goalContract).toMatchObject({
      primaryObject: "drawing",
      coreMechanic: "apply a visual style to a drawing",
      endState: "styled drawing preview"
    });
  });

  it("asks creative-tool co-planning questions instead of generic app verbs", () => {
    const understanding = inferGoalUnderstanding("我想要做一个自动给我的 drawing 添加风格的软件");
    const first = generatePlanningChoices(understanding.originalIdea, "finished-artifact", understanding);
    const second = generatePlanningChoices(understanding.originalIdea, "first-user-action", understanding);
    const third = generatePlanningChoices(understanding.originalIdea, "first-system-response", understanding);
    const allLabels = [...first, ...second, ...third].map((choice) => choice.label);

    expect(first.map((choice) => choice.label)).toContain("Upload a drawing");
    expect(second.map((choice) => choice.label)).toContain("Add a cartoon style");
    expect(third.map((choice) => choice.label)).toContain("Show before and after");
    expect(allLabels).not.toContain("Open it");
    expect(allLabels).not.toContain("Choose something");
    expect(allLabels).not.toContain("Try an action");
  });

  it("confirms goal understanding before the first co-planning question", () => {
    const started = createProjectFromIdea("I want to make software that automatically adds a style to my drawing.");
    const session = {
      id: "planning-creative",
      projectId: started.id,
      idea: started.originalIdea,
      status: "goal_understanding_generated" as const,
      responses: [],
      candidateParts: [],
      goalUnderstanding: inferGoalUnderstanding(started.originalIdea),
      createdAt: "2026-05-12T00:00:00.000Z",
      updatedAt: "2026-05-12T00:00:00.000Z"
    };

    expect(() => answerPlanningQuestion({
      session,
      questionId: "finished-artifact",
      answer: "Upload a drawing",
      source: "choice"
    })).toThrow(/Confirm the goal understanding/);

    const confirmed = confirmGoalUnderstanding({ project: started, session });
    expect(confirmed.planningSession.status).toBe("goal_understanding_confirmed");
    expect(confirmed.currentQuestion?.prompt).toBe("How should the drawing or image get into the tool?");
  });

  it("blocks goal confirmation until the goal contract is ready", () => {
    const project = createProjectFromIdea("I want to make a game");
    const started = startCoPlanning(project.originalIdea);

    expect(started.planningSession.status).toBe("goal_understanding_needs_clarification");
    expect(() => confirmGoalUnderstanding({
      project,
      session: started.planningSession,
      action: "confirm"
    })).toThrow(/Answer the goal question/);
  });

  it("can clarify an immature goal across goal-question turns before confirmation", () => {
    const project = createProjectFromIdea("I want to make a game");
    const started = startCoPlanning(project.originalIdea);
    const firstQuestion = started.goalUnderstanding.goalReadiness?.nextQuestion;
    expect(firstQuestion).toBeTruthy();

    const withMechanic = confirmGoalUnderstanding({
      project,
      session: started.planningSession,
      action: "answer-goal-question",
      question: firstQuestion,
      answer: "The player feeds the pet and happiness changes.",
      source: "free-input"
    });
    expect(withMechanic.planningSession.status).toBe("goal_understanding_needs_clarification");
    expect(withMechanic.goalUnderstanding.goalReadiness?.missingFields).toContain("endState");

    const secondQuestion = withMechanic.goalUnderstanding.goalReadiness?.nextQuestion;
    const ready = confirmGoalUnderstanding({
      project: withMechanic.project,
      session: withMechanic.planningSession,
      action: "answer-goal-question",
      question: secondQuestion,
      answer: "The goal is to keep the pet happy for 3 days.",
      source: "free-input"
    });
    expect(ready.planningSession.status).toBe("goal_understanding_generated");
    expect(ready.goalUnderstanding.goalReadiness?.readyForConfirmation).toBe(true);

    const confirmed = confirmGoalUnderstanding({
      project: ready.project,
      session: ready.planningSession,
      action: "confirm"
    });
    expect(confirmed.planningSession.status).toBe("goal_understanding_confirmed");
    expect(confirmed.currentQuestion).toBeTruthy();
  });

  it("creates creative-tool candidate parts from the understood idea", () => {
    const project = createProjectFromIdea("I want to make software that automatically adds a style to my drawing.");
    const confirmed = confirmGoalUnderstanding({
      project,
      session: {
        id: "planning-creative",
        projectId: project.id,
        idea: project.originalIdea,
        status: "goal_understanding_generated",
        responses: [],
        candidateParts: [],
        goalUnderstanding: inferGoalUnderstanding(project.originalIdea),
        createdAt: "2026-05-12T00:00:00.000Z",
        updatedAt: "2026-05-12T00:00:00.000Z"
      }
    });
    const q1 = answerPlanningQuestion({
      session: confirmed.planningSession,
      questionId: "finished-artifact",
      answer: "Upload a drawing",
      source: "choice"
    }).planningSession;
    const q2 = answerPlanningQuestion({
      session: q1,
      questionId: "first-user-action",
      answer: "Add a cartoon style",
      source: "choice"
    }).planningSession;
    const q3 = answerPlanningQuestion({
      session: q2,
      questionId: "first-system-response",
      answer: "Show before and after",
      source: "choice"
    }).planningSession;

    expect(q3.candidateParts.map((part) => part.title)).toEqual(expect.arrayContaining([
      "Drawing input",
      "Style picker",
      "Styled preview",
      "Before/after comparison",
      "Try another style",
      "Save styled drawing"
    ]));
  });

  it("progressively creates a draft trail only after learner co-planning responses", () => {
    const project = createProjectFromIdea("I want to make a homework helper agent.");
    const session = {
      id: "planning-1",
      projectId: project.id,
      idea: project.originalIdea,
      status: "goal_understanding_confirmed" as const,
      responses: [],
      candidateParts: [],
      goalUnderstanding: inferGoalUnderstanding(project.originalIdea),
      createdAt: "2026-05-12T00:00:00.000Z",
      updatedAt: "2026-05-12T00:00:00.000Z"
    };
    const q1 = answerPlanningQuestion({
      session,
      questionId: "finished-artifact",
      answer: "Get hints instead of answers",
      source: "choice"
    }).planningSession;
    const q2 = answerPlanningQuestion({
      session: q1,
      questionId: "first-user-action",
      answer: "Share what I already tried",
      source: "choice"
    }).planningSession;
    const q3 = answerPlanningQuestion({
      session: q2,
      questionId: "first-system-response",
      answer: "Give a hint",
      source: "choice"
    }).planningSession;

    expect(q3.status).toBe("system_response_clarified");
    expect(q3.candidateParts.length).toBeGreaterThanOrEqual(4);
    expect(q3.candidateParts.map((part) => part.title)).toContain("Give a hint");

    const draft = createDraftTrailFromCandidates(q3);
    expect(draft.planningSession.status).toBe("draft_trail_created");
    expect(draft.draftTrail.nodes.every((node) => node.status === "draft")).toBe(true);
  });

  it("blocks confirmed System Trail until the learner reviews the draft", () => {
    const project = createProjectFromIdea("I want to make a jumping arcade game.");
    const session = {
      id: "planning-1",
      projectId: project.id,
      idea: project.originalIdea,
      status: "system_response_clarified" as const,
      responses: [],
      candidateParts: [
        { id: "c1", title: "Jump control", visibleBehavior: "The character jumps.", systemRole: "user action", selected: true, source: "ai-suggested" as const },
        { id: "c2", title: "Obstacles move", visibleBehavior: "Obstacles move toward the character.", systemRole: "system change", selected: true, source: "ai-suggested" as const }
      ],
      createdAt: "2026-05-12T00:00:00.000Z",
      updatedAt: "2026-05-12T00:00:00.000Z"
    };
    const draft = createDraftTrailFromCandidates(session);

    expect(() =>
      confirmDraftTrail({
        project,
        session: draft.planningSession,
        draftTrail: draft.draftTrail,
        selectedFirstNodeId: draft.draftTrail.nodes[0].id
      })
    ).toThrow(/Review the draft trail/);

    const reviewed = reviewDraftTrail(draft.planningSession, draft.draftTrail);
    const confirmed = confirmDraftTrail({
      project,
      session: reviewed.planningSession,
      draftTrail: reviewed.draftTrail,
      selectedFirstNodeId: reviewed.draftTrail.nodes[0].id
    });

    expect(confirmed.planningSession.status).toBe("completed");
    expect(confirmed.project.systemTrail.nodes[0].status).toBe("current");
    expect(confirmed.project.status).toBe("trail_confirmed");
  });

  it("generates different visible System Trails for different ideas", () => {
    const pet = generateSystemTrailFromIdea("I want to make a pet adventure game.");
    const habitat = generateSystemTrailFromIdea("I want to make a habitat simulation.");
    const story = generateSystemTrailFromIdea("I want to make a story world website.");

    expect(pet.nodes.map((node) => node.title)).toContain("Pet reacts");
    expect(habitat.nodes.map((node) => node.title)).toContain("Living thing reacts");
    expect(story.nodes.map((node) => node.title)).toContain("Story choice changes path");
    expect(new Set([pet.nodes[0].title, habitat.nodes[0].title, story.nodes[0].title]).size).toBe(3);
  });

  it("returns 4-6 visible system capabilities and avoids implementation titles", () => {
    for (const idea of [
      "I want to make a pet adventure game.",
      "I want to make an app for my club tasks.",
      "I want to make a story world website.",
      "I want to make a habitat simulation.",
      "I want to make a quiz game about my school.",
      "I want to make a music mood board."
    ]) {
      const trail = generateSystemTrailFromIdea(idea);
      expect(trail.nodes.length).toBeGreaterThanOrEqual(4);
      expect(trail.nodes.length).toBeLessThanOrEqual(6);
      expect(trail.nodes.every((node) => node.visibleBehavior.length > 10)).toBe(true);
      expect(implementationWords.test(trail.nodes.map((node) => node.title).join(" "))).toBe(false);
    }
  });

  it("preserves student-authored checklist items before AI suggestions", () => {
    const checklist: ChecklistItem[] = [
      { id: "c1", text: "I can choose food.", source: "student", status: "unchecked" },
      { id: "c2", text: "The pet reacts.", source: "student", status: "unchecked" }
    ];

    expect(checklist.every((item) => item.source === "student")).toBe(true);
    expect(checklist.map((item) => item.text)).toEqual(["I can choose food.", "The pet reacts."]);
  });

  it("gives short supportive checklist feedback without replacing student text", () => {
    const node = createProjectPath("I want to make a pet adventure game.").project.systemTrail.nodes[2];
    const feedback = reviewChecklist({
      node,
      draftChecklist: "It works\nI can choose food"
    });

    expect(feedback.tooVague.map((item) => item.text)).toContain("It works");
    expect(feedback.goodAndCheckable.map((item) => item.text)).toContain("I can choose food");
    expect(feedback.assistantMessage.length).toBeLessThan(120);
    expect(feedback.improvedChecklist.join("|") === ["It works", "I can choose food"].join("|")).toBe(false);
  });

  it("plans logic from the real selected system node", () => {
    const petNode = createProjectPath("I want to make a pet adventure game.").project.systemTrail.nodes[2];
    const taskNode = createProjectPath("I want to make an app for my club tasks.").project.systemTrail.nodes[2];

    expect(logicChainForNode(petNode).map((step) => step.title)).toContain("Pet checks choice");
    expect(logicChainForNode(taskNode).map((step) => step.title)).toContain("Task status changes");

    const plan = planMilestone({ node: petNode, checklist: ["When I choose food, the pet reacts."] });
    expect(plan.story.after).toContain("pet");
    expect(plan.logicChain[0].role).toBe("user-action");
  });

  it("keeps generated patches scoped to the selected system node", () => {
    const node = createProjectPath("I want to make an app for my club tasks.").project.systemTrail.nodes[2];
    const patch = generatePatch({ node, checklist: ["I can click a task.", "The task moves to done."] });

    expect(patch.changedFiles).toEqual(["sketch.js"]);
    expect(patch.validation.scopedToMilestone).toBe(true);
    expect(patch.validation.noFullProjectGeneration).toBe(true);
    expect(patch.changeSummary.join(" ")).toContain(node.visibleBehavior);
    expect(patch.code).toContain(node.title);
  });
});
