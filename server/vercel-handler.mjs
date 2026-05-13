async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (typeof request.body === "string") return request.body ? JSON.parse(request.body) : {};

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.end(JSON.stringify(payload));
}

export async function handleJsonPost(request, response, handler) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      sendJson(response, 503, { error: "OPENAI_API_KEY is not configured" });
      return;
    }

    const body = await readJsonBody(request);
    const payload = await handler(body);
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, error.status ?? 500, {
      error: error.message ?? "API request failed"
    });
  }
}
