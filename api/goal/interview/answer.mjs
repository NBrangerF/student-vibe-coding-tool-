import { answerGoalInterview } from "../../../server/openai-service.mjs";
import { handleJsonPost } from "../../../server/vercel-handler.mjs";

export default async function handler(request, response) {
  return handleJsonPost(request, response, answerGoalInterview);
}

