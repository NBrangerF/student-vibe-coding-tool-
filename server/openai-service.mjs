import https from "node:https";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 12000);

function compactText(value, maxLength = 160) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/(.)\1{4,}/gu, "$1$1$1")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function compactList(list, maxItems, maxLength) {
  return (Array.isArray(list) ? list : [])
    .slice(0, maxItems)
    .map((item) => compactText(item, maxLength))
    .filter(Boolean);
}

function collectJson(response) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(new Error(`OpenAI returned invalid JSON: ${error.message}`));
      }
    });
    response.on("error", reject);
  });
}

function responseText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const chunks = [];
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

function postOpenAIJson(payload, apiKey) {
  const target = new URL(OPENAI_RESPONSES_URL);
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      request.destroy(new Error("OpenAI request timed out"));
    }, OPENAI_TIMEOUT_MS);
    const request = https.request(
      {
        hostname: target.hostname,
        port: 443,
        path: target.pathname,
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        },
        agent: false
      },
      async (response) => {
        clearTimeout(timer);
        try {
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode ?? 500,
            data: await collectJson(response)
          });
        } catch (error) {
          reject(error);
        }
      }
    );
    request.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    request.end(body);
  });
}

export async function callStructuredOpenAI({ name, schema, system, user }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not configured");
    error.status = 503;
    throw error;
  }

  const response = await postOpenAIJson({
    model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    input: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    text: {
      format: {
        type: "json_schema",
        name,
        schema,
        strict: true
      }
    },
    store: false
  }, apiKey);

  if (!response.ok) {
    const error = new Error(response.data?.error?.message || "OpenAI request failed");
    error.status = response.status;
    throw error;
  }

  const text = responseText(response.data);
  if (!text) throw new Error("OpenAI returned no structured text");
  return JSON.parse(text);
}

const systemPrompt = `
You are an AI build companion for K-12 creative programming.
Language: English for all student-facing text.
Goal-to-Milestone is open-ended and systems-first.
Do not assume School Quiz Game.
Do not generate a full project.
Ask one short question or provide one short scaffold at a time.
Use visible system capabilities, not implementation tasks.
Return valid JSON only.
`.trim();

const simpleQuestionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["engineSource", "reflectedGoal", "progressLabel", "nextQuestion", "turns", "pathMap", "readiness", "assistantMessage"],
  properties: {
    engineSource: { type: "string", enum: ["openai"] },
    reflectedGoal: { type: "string" },
    progressLabel: { type: "string" },
    nextQuestion: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "prompt", "options", "allowFreeText"],
          properties: {
            id: { type: "string" },
            prompt: { type: "string" },
            options: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
            allowFreeText: { type: "boolean" }
          }
        },
        { type: "null" }
      ]
    },
    turns: { type: "array", items: { type: "object", additionalProperties: true } },
    pathMap: { type: "object", additionalProperties: true },
    readiness: { type: "object", additionalProperties: true },
    assistantMessage: { type: "string" }
  }
};

const checklistFeedbackSchema = {
  type: "object",
  additionalProperties: false,
  required: ["engineSource", "goodAndCheckable", "tooVague", "missingStep", "improvedChecklist", "assistantMessage"],
  properties: {
    engineSource: { type: "string", enum: ["openai"] },
    goodAndCheckable: { type: "array", items: { type: "object", additionalProperties: true } },
    tooVague: { type: "array", items: { type: "object", additionalProperties: true } },
    missingStep: { type: "array", items: { type: "object", additionalProperties: true } },
    improvedChecklist: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
    assistantMessage: { type: "string" }
  }
};

export async function startGoalInterview(body) {
  return callStructuredOpenAI({
    name: "goal_interview_response",
    schema: simpleQuestionSchema,
    system: systemPrompt,
    user: JSON.stringify({
      task: "Start a co-planning interview. Ask exactly one next question.",
      idea: body.idea
    })
  });
}

export async function answerGoalInterview(body) {
  return callStructuredOpenAI({
    name: "goal_interview_response",
    schema: simpleQuestionSchema,
    system: systemPrompt,
    user: JSON.stringify({
      task: "Continue the co-planning interview. Ask exactly one next question unless ready.",
      idea: body.idea,
      previousTurns: body.turns ?? [],
      answeredQuestionId: body.questionId,
      latestAnswer: body.answer
    })
  });
}

export async function generateProjectPath(body) {
  const title = compactText(body.idea, 60).replace(/^i want to make\s+/i, "") || "My Project";
  return {
    engineSource: "openai",
    project: {
      id: `project-${Date.now()}`,
      title,
      originalIdea: compactText(body.idea, 220),
      shortDescription: `A project about: ${compactText(body.idea, 120)}`,
      currentFocusNodeId: "node-1",
      status: "trail_generated",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      systemTrail: {
        nodes: [
          {
            id: "node-1",
            title: "First visible part",
            visibleBehavior: "The learner sees the first part of the project.",
            systemRole: "entry",
            status: "current",
            order: 1,
            dependencies: [],
            suggestedMilestones: [
              {
                id: "node-1-first",
                title: "First visible part",
                before: "The screen is empty.",
                after: "The first project part appears.",
                rationale: "This creates visible progress."
              }
            ]
          }
        ],
        edges: []
      }
    },
    starterCode: "",
    assistantMessage: "The trail should be confirmed through co-planning before building."
  };
}

export async function reviewChecklist(body) {
  const draftChecklist = compactList(String(body.draftChecklist ?? "").split(/\n|;/u), 5, 90);
  return callStructuredOpenAI({
    name: "checklist_feedback_response",
    schema: checklistFeedbackSchema,
    system: systemPrompt,
    user: JSON.stringify({
      task: "Review a student's checklist. Keep feedback short and supportive.",
      milestone: body.milestone ?? body.node,
      draftChecklist,
      rules: [
        "Do not replace the student's words silently.",
        "Each improved item must be visible or testable.",
        "Do not mention code syntax."
      ]
    })
  });
}
