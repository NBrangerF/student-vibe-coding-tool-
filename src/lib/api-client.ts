import { mockPostJson } from "@/lib/mock-api";

const SHOULD_FALL_BACK = new Set([404, 501, 503]);
const MOCK_FALLBACK_DISABLED_PREFIXES = ["/api/planning/"];

export async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const canUseMockFallback = !MOCK_FALLBACK_DISABLED_PREFIXES.some((prefix) => url.startsWith(prefix));
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (response.ok) return (await response.json()) as TResponse;

    if (canUseMockFallback && SHOULD_FALL_BACK.has(response.status)) {
      return mockPostJson<TResponse>(url, body);
    }

    const payload = await response.json().catch(() => ({}));
    throw new Error(typeof payload.error === "string" ? payload.error : `Request failed with ${response.status}`);
  } catch (error) {
    if (canUseMockFallback && error instanceof TypeError) return mockPostJson<TResponse>(url, body);
    throw error;
  }
}
