import {
  answerGoalInterview,
  createClarification,
  createGoalInterview,
  createProjectPath,
  diagnoseDebug,
  generatePatch,
  planMilestone
} from "@/lib/mvp-engine";
import { Checkpoint, GoalInterviewTurn, Milestone, PreviewState, ProjectPathMap } from "@/lib/types";

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 180);
  });
}

export async function mockPostJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const payload = body as Record<string, unknown>;

  if (url === "/api/idea/clarify") {
    const idea = String(payload.idea ?? "").trim();
    if (!idea) throw new Error("idea is required");
    return delay(createClarification(idea) as TResponse);
  }

  if (url === "/api/goal/interview/start") {
    const idea = String(payload.idea ?? "").trim();
    if (!idea) throw new Error("idea is required");
    return delay(createGoalInterview(idea) as TResponse);
  }

  if (url === "/api/goal/interview/answer") {
    const idea = String(payload.idea ?? "").trim();
    const questionId = String(payload.questionId ?? "").trim();
    const answer = String(payload.answer ?? "").trim();
    if (!idea || !questionId || !answer) throw new Error("idea, questionId, and answer are required");
    return delay(
      answerGoalInterview({
        idea,
        turns: (payload.turns as GoalInterviewTurn[]) ?? [],
        questionId,
        answer
      }) as TResponse
    );
  }

  if (url === "/api/project/path") {
    const idea = String(payload.idea ?? "").trim();
    if (!idea) throw new Error("idea is required");
    const planningInput = ((payload.interviewTurns as GoalInterviewTurn[]) ??
      (payload.clarificationAnswers as string[]) ??
      []) as GoalInterviewTurn[] | string[];
    return delay(createProjectPath(idea, planningInput, payload.pathMap as ProjectPathMap | undefined) as TResponse);
  }

  if (url === "/api/milestone/plan") {
    if (!payload.milestone) throw new Error("milestone is required");
    return delay(planMilestone(payload.milestone as Milestone) as TResponse);
  }

  if (url === "/api/build/patch") {
    if (!payload.milestone) throw new Error("milestone is required");
    return delay(generatePatch(payload.milestone as Milestone) as TResponse);
  }

  if (url === "/api/preview/run") {
    const code = String(payload.code ?? "");
    if (!code) throw new Error("code is required");
    return delay({
      status: "running",
      runCount: Number(payload.runCount ?? 0) + 1,
      console: ["Preview ran. Check what you can see."],
      lastRunAt: new Date().toISOString()
    } as TResponse);
  }

  if (url === "/api/debug/diagnose") {
    return delay(
      diagnoseDebug({
        visibleBehavior: payload.visibleBehavior as string | undefined,
        failedChecklistItem: payload.failedChecklistItem as string | undefined,
        milestone: payload.milestone as Milestone | undefined
      }) as TResponse
    );
  }

  if (url === "/api/checkpoint/create") {
    if (!payload.projectId || !payload.milestoneId || !payload.filesSnapshot) {
      throw new Error("projectId, milestoneId, and filesSnapshot are required");
    }

    const checkpoint: Checkpoint = {
      id: `checkpoint-${Date.now()}`,
      projectId: String(payload.projectId),
      milestoneId: String(payload.milestoneId),
      name: String(payload.name ?? "Saved version"),
      filesSnapshot: payload.filesSnapshot as Record<string, string>,
      previewState: (payload.previewState as PreviewState | undefined) ?? { status: "idle", runCount: 0, console: [] },
      createdAt: new Date().toISOString()
    };

    return delay(checkpoint as TResponse);
  }

  if (url === "/api/checkpoint/rollback") {
    const checkpoint = payload.checkpoint as Checkpoint | undefined;
    if (!checkpoint) throw new Error("checkpoint is required");
    return delay({
      restoredCode: checkpoint.filesSnapshot["sketch.js"],
      previewState: checkpoint.previewState,
      checkpoint
    } as TResponse);
  }

  throw new Error(`Unknown API contract: ${url}`);
}
