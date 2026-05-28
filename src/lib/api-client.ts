import { mockPostJson } from "@/lib/mock-api";

const SHOULD_FALL_BACK = new Set([404, 501, 503]);

export async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (response.ok) return (await response.json()) as TResponse;

    if (SHOULD_FALL_BACK.has(response.status)) {
      return mockPostJson<TResponse>(url, body);
    }

    const payload = await response.json().catch(() => ({}));
    throw new Error(typeof payload.error === "string" ? payload.error : `Request failed with ${response.status}`);
  } catch (error) {
    if (error instanceof TypeError) return mockPostJson<TResponse>(url, body);
    throw error;
  }
}
