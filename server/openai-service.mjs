import http from "node:http";
import https from "node:https";
import tls from "node:tls";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function compactText(value, maxLength) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/(.)\1{4,}/gu, "$1$1$1")
    .trim();
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  return `${chars.slice(0, Math.max(0, maxLength - 3)).join("")}...`;
}

function compactList(list, maxItems, maxLength) {
  return (Array.isArray(list) ? list : [])
    .slice(0, maxItems)
    .map((item) => compactText(item, maxLength))
    .filter(Boolean);
}

function compactOption(value) {
  const repaired = compactText(value, 80)
    .replace(/multiplechoice/giu, "Multiple choice")
    .replace(/trueorfalse/giu, "True or false")
    .replace(/quizgame/giu, "Quiz game")
    .replace(/startbutton/giu, "Start button")
    .replace(/titlescreen/giu, "Title screen")
    .replace(/teachers andal/giu, "Teachers");
  const beforeExplanation = repaired.split(/[。！？!?，,；;：:\n]/u)[0];
  const cleaned = beforeExplanation
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/gu, "")
    .trim();
  const words = cleaned.split(/\s+/u);
  let label = "";
  for (const word of words) {
    const candidate = label ? `${label} ${word}` : word;
    if (Array.from(candidate).length > 18) break;
    label = candidate;
  }

  const bounded = (label || compactText(cleaned, 18)).replace(/\s+[A-Za-z]{1,3}$/u, "");
  return bounded.replace(/\s+(and|or|with|about)$/iu, "");
}

function normalizeQuestion(question) {
  if (!question) return null;
  return {
    id: compactText(question.id, 48),
    prompt: compactText(question.prompt, 80),
    options: (Array.isArray(question.options) ? question.options : [])
      .slice(0, 3)
      .map(compactOption)
      .filter(Boolean),
    allowFreeText: Boolean(question.allowFreeText)
  };
}

function normalizePathMap(pathMap) {
  return {
    ...pathMap,
    title: compactText(pathMap?.title, 48),
    summary: compactText(pathMap?.summary, 180),
    nodes: (Array.isArray(pathMap?.nodes) ? pathMap.nodes : []).slice(0, 8).map((node) => ({
      ...node,
      id: compactText(node.id, 48),
      label: compactText(node.label, 42),
      detail: compactText(node.detail, 140),
      evidence: compactText(node.evidence, 100)
    })),
    edges: (Array.isArray(pathMap?.edges) ? pathMap.edges : []).slice(0, 8).map((edge) => ({
      ...edge,
      from: compactText(edge.from, 48),
      to: compactText(edge.to, 48),
      label: compactText(edge.label, 28)
    })),
    openQuestions: compactList(pathMap?.openQuestions, 5, 80),
    updatedAt: compactText(pathMap?.updatedAt, 32)
  };
}

function normalizeGoalInterview(response) {
  return {
    ...response,
    reflectedGoal: compactText(response.reflectedGoal, 140),
    progressLabel: compactText(response.progressLabel, 32),
    nextQuestion: normalizeQuestion(response.nextQuestion),
    turns: (Array.isArray(response.turns) ? response.turns : []).map((turn) => ({
      questionId: compactText(turn.questionId, 48),
      prompt: compactText(turn.prompt, 100),
      answer: compactText(turn.answer, 140),
      createdAt: compactText(turn.createdAt, 32)
    })),
    pathMap: normalizePathMap(response.pathMap),
    assistantMessage: compactText(response.assistantMessage, 180)
  };
}

function normalizeProjectPath(response) {
  return {
    ...response,
    milestones: (Array.isArray(response.milestones) ? response.milestones : []).map((milestone) => ({
      ...milestone,
      title: compactText(milestone.title, 48),
      visibleOutput: compactText(milestone.visibleOutput, 140),
      concepts: compactList(milestone.concepts, 4, 28),
      doneChecklist: compactList(milestone.doneChecklist, 5, 90)
    })),
    pathMap: normalizePathMap(response.pathMap),
    assistantMessage: compactText(response.assistantMessage, 180)
  };
}

const questionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "prompt", "options", "allowFreeText"],
  properties: {
    id: { type: "string", maxLength: 48 },
    prompt: { type: "string", maxLength: 80 },
    options: { type: "array", minItems: 3, maxItems: 3, items: { type: "string", maxLength: 32 } },
    allowFreeText: { type: "boolean" }
  }
};

const turnSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questionId", "prompt", "answer", "createdAt"],
  properties: {
    questionId: { type: "string", maxLength: 48 },
    prompt: { type: "string", maxLength: 100 },
    answer: { type: "string", maxLength: 140 },
    createdAt: { type: "string", maxLength: 32 }
  }
};

const pathMapSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "confidence", "nodes", "edges", "openQuestions", "updatedAt"],
  properties: {
    title: { type: "string", maxLength: 48 },
    summary: { type: "string", maxLength: 180 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    nodes: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "type", "status", "label", "detail", "evidence"],
        properties: {
          id: { type: "string", maxLength: 48 },
          type: { type: "string", enum: ["goal", "experience", "mechanic", "milestone", "later"] },
          status: { type: "string", enum: ["known", "draft", "open"] },
          label: { type: "string", maxLength: 42 },
          detail: { type: "string", maxLength: 140 },
          evidence: { type: "string", maxLength: 100 }
        }
      }
    },
    edges: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["from", "to", "label"],
        properties: {
          from: { type: "string", maxLength: 48 },
          to: { type: "string", maxLength: 48 },
          label: { type: "string", maxLength: 28 }
        }
      }
    },
    openQuestions: { type: "array", maxItems: 5, items: { type: "string", maxLength: 80 } },
    updatedAt: { type: "string", maxLength: 32 }
  }
};

const goalInterviewSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "engineSource",
    "reflectedGoal",
    "progressLabel",
    "nextQuestion",
    "turns",
    "pathMap",
    "readiness",
    "assistantMessage"
  ],
  properties: {
    engineSource: { type: "string", enum: ["openai"] },
    reflectedGoal: { type: "string", maxLength: 140 },
    progressLabel: { type: "string", maxLength: 32 },
    nextQuestion: { anyOf: [questionSchema, { type: "null" }] },
    turns: { type: "array", items: turnSchema },
    pathMap: pathMapSchema,
    readiness: {
      type: "object",
      additionalProperties: false,
      required: ["answeredCount", "requiredCount", "canGeneratePath", "missing"],
      properties: {
        answeredCount: { type: "integer", minimum: 0 },
        requiredCount: { type: "integer", minimum: 5 },
        canGeneratePath: { type: "boolean" },
        missing: { type: "array", maxItems: 6, items: { type: "string", maxLength: 40 } }
      }
    },
    assistantMessage: { type: "string", maxLength: 180 }
  }
};

const milestoneSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "projectId", "order", "title", "visibleOutput", "concepts", "doneChecklist", "status"],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
    order: { type: "integer", minimum: 1 },
    title: { type: "string", maxLength: 48 },
    visibleOutput: { type: "string", maxLength: 140 },
    concepts: { type: "array", minItems: 1, maxItems: 4, items: { type: "string", maxLength: 28 } },
    doneChecklist: { type: "array", minItems: 3, maxItems: 5, items: { type: "string", maxLength: 90 } },
    status: { type: "string", enum: ["not_started", "in_progress", "needs_fix", "done"] }
  }
};

const projectPathSchema = {
  type: "object",
  additionalProperties: false,
  required: ["engineSource", "project", "milestones", "starterCode", "pathMap", "assistantMessage"],
  properties: {
    engineSource: { type: "string", enum: ["openai"] },
    project: {
      type: "object",
      additionalProperties: false,
      required: ["id", "ownerId", "title", "originalIdea", "projectType", "currentMilestoneId", "status", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string" },
        ownerId: { type: "string" },
        title: { type: "string" },
        originalIdea: { type: "string" },
        projectType: { type: "string", enum: ["p5_game_animation"] },
        currentMilestoneId: { type: "string" },
        status: { type: "string", enum: ["path_generated"] },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      }
    },
    milestones: { type: "array", minItems: 4, maxItems: 6, items: milestoneSchema },
    starterCode: { type: "string" },
    pathMap: pathMapSchema,
    assistantMessage: { type: "string", maxLength: 180 }
  }
};

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

function getProxyUrl() {
  if (process.env.NODE_USE_ENV_PROXY !== "1") return null;
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  return proxy ? new URL(proxy) : null;
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

function createProxySocket(proxyUrl, target) {
  return new Promise((resolve, reject) => {
    const proxyPort = Number(proxyUrl.port || (proxyUrl.protocol === "https:" ? 443 : 80));
    const headers = { Host: `${target.hostname}:${target.port || 443}` };
    if (proxyUrl.username || proxyUrl.password) {
      headers["Proxy-Authorization"] = `Basic ${Buffer.from(
        `${decodeURIComponent(proxyUrl.username)}:${decodeURIComponent(proxyUrl.password)}`
      ).toString("base64")}`;
    }

    const connect = http.request({
      host: proxyUrl.hostname,
      port: proxyPort,
      method: "CONNECT",
      path: `${target.hostname}:${target.port || 443}`,
      headers
    });

    connect.once("connect", (response, socket) => {
      if (response.statusCode !== 200) {
        socket.destroy();
        reject(new Error(`Proxy CONNECT failed with ${response.statusCode}`));
        return;
      }

      const tlsSocket = tls.connect({
        socket,
        servername: target.hostname
      });
      tlsSocket.once("secureConnect", () => resolve(tlsSocket));
      tlsSocket.once("error", reject);
    });

    connect.once("error", reject);
    connect.end();
  });
}

function decodeChunkedBody(buffer) {
  const chunks = [];
  let offset = 0;
  const delimiter = Buffer.from("\r\n");

  while (offset < buffer.length) {
    const lineEnd = buffer.indexOf(delimiter, offset);
    if (lineEnd === -1) break;
    const size = Number.parseInt(buffer.subarray(offset, lineEnd).toString("ascii"), 16);
    if (!Number.isFinite(size) || size < 0) break;
    if (size === 0) break;
    const chunkStart = lineEnd + delimiter.length;
    chunks.push(buffer.subarray(chunkStart, chunkStart + size));
    offset = chunkStart + size + delimiter.length;
  }

  return Buffer.concat(chunks);
}

function parseHttpJson(buffer) {
  const separator = Buffer.from("\r\n\r\n");
  const headerEnd = buffer.indexOf(separator);
  if (headerEnd === -1) throw new Error("OpenAI proxy response was incomplete");

  const headerText = buffer.subarray(0, headerEnd).toString("utf8");
  const [statusLine, ...headerLines] = headerText.split("\r\n");
  const status = Number(statusLine.split(" ")[1] ?? 500);
  const headers = new Map(
    headerLines.map((line) => {
      const index = line.indexOf(":");
      return [line.slice(0, index).toLowerCase(), line.slice(index + 1).trim().toLowerCase()];
    })
  );
  const rawBody = buffer.subarray(headerEnd + separator.length);
  const body =
    headers.get("transfer-encoding") === "chunked" ? decodeChunkedBody(rawBody) : rawBody;

  return {
    ok: status >= 200 && status < 300,
    status,
    data: JSON.parse(body.toString("utf8"))
  };
}

async function postOpenAIJsonViaProxy(target, body, headers, proxyUrl) {
  const socket = await createProxySocket(proxyUrl, target);

  return new Promise((resolve, reject) => {
    const chunks = [];
    socket.on("data", (chunk) => chunks.push(chunk));
    socket.once("end", () => {
      try {
        resolve(parseHttpJson(Buffer.concat(chunks)));
      } catch (error) {
        reject(error);
      }
    });
    socket.once("error", reject);
    socket.setTimeout(60000, () => socket.destroy(new Error("OpenAI request timed out")));

    const request = [
      `POST ${target.pathname}${target.search} HTTP/1.1`,
      `Host: ${target.hostname}`,
      "Connection: close",
      ...Object.entries(headers).map(([key, value]) => `${key}: ${value}`),
      "",
      body
    ].join("\r\n");
    socket.write(request);
  });
}

async function postOpenAIJson(payload, apiKey) {
  const target = new URL(OPENAI_RESPONSES_URL);
  const body = JSON.stringify(payload);
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  };
  const proxyUrl = getProxyUrl();
  if (proxyUrl) return postOpenAIJsonViaProxy(target, body, headers, proxyUrl);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: target.hostname,
        port: Number(target.port || 443),
        path: `${target.pathname}${target.search}`,
        method: "POST",
        headers,
        agent: false
      },
      async (response) => {
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

    request.once("error", reject);
    request.setTimeout(60000, () => request.destroy(new Error("OpenAI request timed out")));
    request.end(body);
  });
}

async function callStructuredOpenAI({ name, schema, system, user }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not configured");
    error.status = 503;
    throw error;
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const response = await postOpenAIJson({
    model,
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

  const data = response.data;
  if (!response.ok) {
    const error = new Error(data.error?.message || "OpenAI request failed");
    error.status = response.status;
    throw error;
  }

  const text = responseText(data);
  if (!text) throw new Error("OpenAI returned no structured text");
  return JSON.parse(text);
}

const systemPrompt = `
You are an AI build companion for K-12 creative programming.
Language: English for all student-facing text.
Core interaction: goal-to-project-path is a multi-question interview, not a one-shot form.
The question interface and path map are equally important.
The path map must grow gradually:
- At the beginning, show goal and the next unknown area.
- Do not show future milestones before the student's answers justify them.
- Only create a startable Milestone 1 when the first visible build step is clear.
Protect motivation: short questions, concrete options, no long reflection, no school-like rubrics.
The first implementation target is a p5.js school quiz game or small game/animation.
Every option, label, and button-like text must be short enough for a compact UI.
Question options must be natural English noun or verb phrases, usually 2-4 words.
Do not merge words, invent words, repeat fragments, or create labels like "quizuiz".
Return valid JSON only.
`.trim();

export async function startGoalInterview(body) {
  return normalizeGoalInterview(await callStructuredOpenAI({
    name: "goal_interview_response",
    schema: goalInterviewSchema,
    system: systemPrompt,
    user: JSON.stringify({
      task: "Start a goal interview and create the first live path map. Ask exactly one next question.",
      requiredCoreAnswers: 5,
      idea: body.idea
    })
  }));
}

export async function answerGoalInterview(body) {
  return normalizeGoalInterview(await callStructuredOpenAI({
    name: "goal_interview_response",
    schema: goalInterviewSchema,
    system: systemPrompt,
    user: JSON.stringify({
      task: "Update the interview after the latest answer. Rebuild the path map gradually and ask exactly one next question unless ready.",
      requiredCoreAnswers: 5,
      idea: body.idea,
      previousTurns: body.turns ?? [],
      answeredQuestionId: body.questionId,
      latestAnswer: body.answer
    })
  }));
}

export async function generateProjectPath(body) {
  return normalizeProjectPath(await callStructuredOpenAI({
    name: "project_path_response",
    schema: projectPathSchema,
    system: systemPrompt,
    user: JSON.stringify({
      task: "Convert the completed goal interview and path map into a formal milestone path. Do not generate full project code.",
      idea: body.idea,
      turns: body.interviewTurns ?? [],
      pathMap: body.pathMap,
      starterCodeHint:
        "Return a small starter p5.js sketch only. It must not implement milestone gameplay. For the default school quiz, show only a simple title and planning message."
    })
  }));
}
