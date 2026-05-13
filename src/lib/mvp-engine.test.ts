import { describe, expect, it } from "vitest";
import {
  answerGoalInterview,
  createClarification,
  createGoalInterview,
  createProjectPath,
  diagnoseDebug,
  generatePatch,
  planMilestone
} from "@/lib/mvp-engine";

const idea = "I want to make a quiz game about my school.";

describe("Goal-to-Milestone MVP engine", () => {
  it("turns a fuzzy quiz idea into clarification instead of full code", () => {
    const response = createClarification(idea);

    expect(response.questions).toHaveLength(3);
    expect(response.reflectedIdea).toContain("quiz game");
    expect(response.interview.pathMap.nodes.some((node) => node.status === "open")).toBe(true);
  });

  it("runs a multi-turn goal interview while updating the path map", () => {
    const start = createGoalInterview(idea);
    expect(start.readiness.canGeneratePath).toBe(false);
    expect(start.pathMap.confidence).toBeLessThan(0.4);
    expect(start.pathMap.nodes.some((node) => node.type === "milestone")).toBe(false);

    const first = answerGoalInterview({
      idea,
      turns: start.turns,
      questionId: start.nextQuestion!.id,
      answer: "A title screen"
    });
    expect(first.turns).toHaveLength(1);
    expect(first.pathMap.nodes.find((node) => node.id === "experience")?.status).toBe("known");
    expect(first.pathMap.nodes.some((node) => node.type === "milestone")).toBe(false);
    expect(first.nextQuestion?.id).toBe("player-action");
  });

  it("only allows project path generation after enough interview answers", () => {
    let interview = createGoalInterview(idea);
    for (const answer of ["A title screen", "Four choice buttons", "Correct or try again", "Start screen only", "Five sample questions"]) {
      interview = answerGoalInterview({
        idea,
        turns: interview.turns,
        questionId: interview.nextQuestion!.id,
        answer
      });
    }

    expect(interview.readiness.canGeneratePath).toBe(true);
    const path = createProjectPath(idea, interview.turns, interview.pathMap);
    expect(path.pathMap.confidence).toBeGreaterThan(0.8);
    expect(path.milestones).toHaveLength(5);
    expect(path.milestones[0].title).toBe("Create the start screen");
  });

  it("generates a bounded school quiz project path with visible milestones", () => {
    const response = createProjectPath(idea, ["A title screen with a Start button"]);

    expect(response.project.title).toBe("School Quiz Game");
    expect(response.milestones).toHaveLength(5);
    expect(response.starterCode).not.toContain("selectedAnswer");
    expect(response.milestones.every((milestone) => milestone.doneChecklist.length >= 3)).toBe(true);
    expect(response.project.currentMilestoneId).toBe(response.milestones[0].id);
  });

  it("plans a milestone with checklist, logic sketch, and prediction", () => {
    const { milestones } = createProjectPath(idea);
    const milestoneTwo = milestones[1];
    const plan = planMilestone(milestoneTwo);

    expect(plan.milestone.title).toContain("first question");
    expect(plan.logicSketch).toContain("Show: The first question appears");
    expect(plan.predictionQuestion.options[plan.predictionQuestion.correctIndex]).toContain("first question");
  });

  it("keeps generated patches scoped to the selected milestone", () => {
    const { milestones } = createProjectPath(idea);
    const patch = generatePatch(milestones[1]);

    expect(patch.changedFiles).toEqual(["sketch.js"]);
    expect(patch.validation.scopedToMilestone).toBe(true);
    expect(patch.validation.noFullProjectGeneration).toBe(true);
    expect(patch.code).toContain("drawQuestionScreen");
    expect(patch.code).not.toContain("questions = [");
  });

  it("uses real milestone content instead of id suffixes for generated patches", () => {
    const { milestones } = createProjectPath(idea);
    const openAiStyleMilestone = {
      ...milestones[0],
      id: "ms_1_first_question",
      title: "First Question Screen",
      visibleOutput: "A school history question appears with answer buttons and a Correct note.",
      doneChecklist: [
        "The quiz title is visible.",
        "One school history question is visible.",
        "At least 3 answer choices are shown.",
        "Clicking the correct choice shows Correct."
      ]
    };
    const plan = planMilestone(openAiStyleMilestone);
    const patch = generatePatch(openAiStyleMilestone);

    expect(plan.logicSketch).toContain("Show: One school history question is visible");
    expect(patch.changeSummary).toContain("Added: At least 3 answer choices are shown");
    expect(patch.code).toContain("drawFeedback");
    expect(patch.code).not.toContain("Ready for Step 1");
  });

  it("diagnoses from visible behavior and failed checklist", () => {
    const { milestones } = createProjectPath(idea);
    const diagnosis = diagnoseDebug({
      milestone: milestones[1],
      visibleBehavior: "The question appears, but the answer choices are missing.",
      failedChecklistItem: "Four answer choices display correctly"
    });

    expect(diagnosis.visibleBehavior).toContain("answer choices");
    expect(diagnosis.failedChecklistItem).toContain("Four answer choices");
    expect(diagnosis.choices.some((choice) => choice.isLikely)).toBe(true);
  });
});
