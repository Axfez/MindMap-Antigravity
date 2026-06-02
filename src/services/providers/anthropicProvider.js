import Anthropic from "@anthropic-ai/sdk";

let anthropic = null;

export const anthropicProvider = {
  id: "anthropic",
  name: "Claude",
  keyPrefix: "sk-ant-...",
  storageKey: "ANTHROPIC_API_KEY",
  defaultModel: "claude-sonnet-4-6",

  models: [
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4" },
    { id: "claude-opus-4-8", name: "Claude Opus 4" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4" },
  ],

  initialize(apiKey) {
    anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  },

  async ask(prompt, model) {
    if (!anthropic) {
      throw new Error("Provider not initialized");
    }

    try {
      const response = await anthropic.messages.create({
        model: model || this.defaultModel,
        system:
          "You are a helpful learning assistant. Answer the user's question clearly and concisely.",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      });
      return response.content[0].text;
    } catch (error) {
      console.error("Anthropic API Error:", error);
      throw error;
    }
  },

  async testApiKey(key) {
    try {
      const temp = new Anthropic({
        apiKey: key,
        dangerouslyAllowBrowser: true,
      });
      await temp.messages.create({
        model: this.defaultModel,
        max_tokens: 10,
        messages: [{ role: "user", content: "Respond with OK" }],
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
};
