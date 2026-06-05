import { createDraft } from "../../server/planning-session-service.mjs";
import { handleJsonPost } from "../../server/vercel-handler.mjs";

export default async function handler(request, response) {
  return handleJsonPost(request, response, createDraft);
}
