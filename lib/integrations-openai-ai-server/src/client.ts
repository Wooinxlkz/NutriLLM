import OpenAI from "openai";

function createClient(): OpenAI {
  if (
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL &&
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  ) {
    return new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }

  return new Proxy({} as OpenAI, {
    get() {
      throw new Error(
        "OpenAI is not configured. Set AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY to enable AI features.",
      );
    },
  });
}

export const openai = createClient();
