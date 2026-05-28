import { createServer } from "node:http";
import "./load-env.mjs";
import { answerGoalInterview, generateProjectPath, reviewChecklist, startGoalInterview } from "./openai-service.mjs";
import {
  advancePlanningSession,
  answerPlanning,
  confirmGoalUnderstanding,
  confirmPlanning,
  createDraft,
  reviewDraft,
  startPlanning,
  startPlanningSession
} from "./planning-session-service.mjs";

const PORT = Number(process.env.API_PORT ?? 8787);

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const handlers = {
  "/api/goal/interview/start": startGoalInterview,
  "/api/goal/interview/answer": answerGoalInterview,
  "/api/project/path": generateProjectPath,
  "/api/checklist/review": reviewChecklist,
  "/api/planning/start": startPlanning,
  "/api/planning/understanding": confirmGoalUnderstanding,
  "/api/planning/answer": answerPlanning,
  "/api/planning/draft": createDraft,
  "/api/planning/review": reviewDraft,
  "/api/planning/confirm": confirmPlanning,
  "/api/planning/session/start": startPlanningSession,
  "/api/planning/session/advance": advancePlanningSession
};

const localHandlers = new Set([
  "/api/planning/start",
  "/api/planning/understanding",
  "/api/planning/answer",
  "/api/planning/draft",
  "/api/planning/review",
  "/api/planning/confirm",
  "/api/planning/session/start",
  "/api/planning/session/advance"
]);

createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const pathname = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname;
  const handler = handlers[pathname];
  if (!handler) {
    sendJson(response, 404, { error: "Unknown API contract" });
    return;
  }

  try {
    const body = await readJsonBody(request);
    if (!localHandlers.has(pathname) && !process.env.OPENAI_API_KEY) {
      sendJson(response, 503, { error: "OPENAI_API_KEY is not configured" });
      return;
    }

    const payload = await handler(body);
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, error.status ?? 500, {
      error: error.message ?? "API request failed"
    });
  }
}).listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
