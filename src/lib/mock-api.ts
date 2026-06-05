import {
  answerGoalInterview,
  createClarification,
  createDraftTrailFromCandidates,
  createGoalInterview,
  createProjectPath,
  confirmGoalUnderstanding,
  confirmDraftTrail,
  diagnoseDebug,
  answerPlanningQuestion,
  generatePatch,
  planMilestone,
  reviewDraftTrail,
  reviewChecklist,
  startCoPlanning
} from "@/lib/mvp-engine";
import {
  Checkpoint,
  DraftSystemTrail,
  GoalClarificationQuestion,
  GoalInterviewTurn,
  PlanningQuestion,
  PlanningUnderstandingResponse,
  PlanningResponseSource,
  PlanningSession,
  PreviewState,
  Project,
  SystemNode
} from "@/lib/types";

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 160);
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

  if (url === "/api/planning/start") {
    const idea = String(payload.idea ?? "").trim();
    if (!idea) throw new Error("idea is required");
    return delay(startCoPlanning(idea) as TResponse);
  }

  if (url === "/api/planning/understanding") {
    const project = payload.project as Project | undefined;
    const session = payload.session as PlanningSession | undefined;
    const extraDetail = String(payload.extraDetail ?? "").trim();
    const answer = String(payload.answer ?? "").trim();
    if (!project || !session) throw new Error("project and session are required");
    return delay(confirmGoalUnderstanding({
      project,
      session,
      action: payload.action as "confirm" | "revise" | "answer-goal-question" | undefined,
      extraDetail,
      answer,
      question: payload.question as GoalClarificationQuestion | null | undefined,
      source: payload.source as PlanningResponseSource | undefined
    }) as PlanningUnderstandingResponse as TResponse);
  }

  if (url === "/api/planning/session/start") {
    const learnerIdea = String(payload.learnerIdea ?? payload.idea ?? "").trim();
    if (!learnerIdea) throw new Error("learnerIdea is required");
    const started = startCoPlanning(learnerIdea);
    const ready = Boolean(started.goalUnderstanding.goalReadiness?.readyForConfirmation);
    return delay({
      sessionId: started.planningSession.id,
      status: ready ? "GOAL_UNDERSTANDING_GENERATED" : "GOAL_UNDERSTANDING_NEEDS_CLARIFICATION",
      allowedActions: ready ? ["confirm-understanding", "revise-understanding"] : ["answer-goal-question", "revise-understanding"],
      uiInstruction: {
        surface: "goal-understanding",
        quietAI: started.assistantMessage
      },
      data: {
        skill: "goal-understanding",
        projectTitle: started.project.title,
        goalUnderstanding: started.goalUnderstanding,
        quietAI: started.assistantMessage
      },
      session: started.planningSession,
      project: started.project
    } as TResponse);
  }

  if (url === "/api/planning/session/advance") {
    const session = payload.session as PlanningSession | undefined;
    if (!session) throw new Error("session is required");
    return delay({
      sessionId: session.id,
      status: "IDEA_REFLECTED",
      allowedActions: ["answer-question"],
      uiInstruction: {
        surface: "question",
        quietAI: "Fallback planning is active."
      },
      data: {
        skill: "goal-intake",
        quietAI: "Fallback planning is active."
      },
      session,
      project: payload.project
    } as TResponse);
  }

  if (url === "/api/planning/answer") {
    const session = payload.session as PlanningSession | undefined;
    const questionId = payload.questionId as PlanningQuestion["id"] | undefined;
    const answer = String(payload.answer ?? "").trim();
    const source = (payload.source as PlanningResponseSource | undefined) ?? "choice";
    if (!session || !questionId || !answer) throw new Error("session, questionId, and answer are required");
    return delay(answerPlanningQuestion({ session, questionId, answer, source }) as TResponse);
  }

  if (url === "/api/planning/draft") {
    const session = payload.session as PlanningSession | undefined;
    if (!session) throw new Error("session is required");
    return delay(createDraftTrailFromCandidates(session) as TResponse);
  }

  if (url === "/api/planning/review") {
    const session = payload.session as PlanningSession | undefined;
    const draftTrail = payload.draftTrail as DraftSystemTrail | undefined;
    if (!session || !draftTrail) throw new Error("session and draftTrail are required");
    return delay(reviewDraftTrail(session, draftTrail) as TResponse);
  }

  if (url === "/api/planning/confirm") {
    const project = payload.project as Project | undefined;
    const session = payload.session as PlanningSession | undefined;
    const draftTrail = payload.draftTrail as DraftSystemTrail | undefined;
    const selectedFirstNodeId = String(payload.selectedFirstNodeId ?? "");
    if (!project || !session || !draftTrail || !selectedFirstNodeId) {
      throw new Error("project, session, draftTrail, and selectedFirstNodeId are required");
    }
    return delay(confirmDraftTrail({ project, session, draftTrail, selectedFirstNodeId }) as TResponse);
  }

  if (url === "/api/project/path") {
    const idea = String(payload.idea ?? "").trim();
    if (!idea) throw new Error("idea is required");
    return delay(createProjectPath(idea) as TResponse);
  }

  if (url === "/api/milestone/plan") {
    if (!payload.node) throw new Error("node is required");
    return delay(
      planMilestone({
        node: payload.node as SystemNode,
        checklist: (payload.checklist as string[] | undefined) ?? []
      }) as TResponse
    );
  }

  if (url === "/api/checklist/review") {
    if (!payload.node) throw new Error("node is required");
    return delay(
      reviewChecklist({
        node: payload.node as SystemNode,
        draftChecklist: String(payload.draftChecklist ?? "")
      }) as TResponse
    );
  }

  if (url === "/api/build/patch") {
    if (!payload.node) throw new Error("node is required");
    return delay(
      generatePatch({
        node: payload.node as SystemNode,
        checklist: (payload.checklist as string[] | undefined) ?? []
      }) as TResponse
    );
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
        node: payload.node as SystemNode | undefined
      }) as TResponse
    );
  }

  if (url === "/api/checkpoint/create") {
    if (!payload.projectId || !payload.nodeId || !payload.filesSnapshot) {
      throw new Error("projectId, nodeId, and filesSnapshot are required");
    }

    const checkpoint: Checkpoint = {
      id: `checkpoint-${Date.now()}`,
      projectId: String(payload.projectId),
      nodeId: String(payload.nodeId),
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
