import { mockPostJson } from "@/lib/mock-api";

const localOnlyRoutes = new Set([
  "/api/idea/clarify",
  "/api/milestone/plan",
  "/api/build/patch",
  "/api/preview/run",
  "/api/debug/diagnose",
  "/api/checkpoint/create",
  "/api/checkpoint/rollback"
]);

export async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  if (localOnlyRoutes.has(url)) {
    return mockPostJson<TResponse>(url, body);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    return (await response.json()) as TResponse;
  } catch {
    return mockPostJson<TResponse>(url, body);
  }
}
