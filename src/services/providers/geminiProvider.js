import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

export const geminiProvider = {
  id: "gemini",
  name: "Gemini",
  keyPrefix: "AQ...",
  storageKey: "GEMINI_API_KEY",
  defaultModel: "gemini-3.5-flash",

  models: [
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro" },
    { id: "gemini-3-flash-preview", name: "Gemini 3.0 Flash" },
  ],

  initialize(apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  },

  async ask(prompt, model) {
    if (!genAI) {
      throw new Error("Provider not initialized");
    }

    try {
      const m = genAI.getGenerativeModel({ model: model || this.defaultModel });
      const result = await m.generateContent([
        "You are a helpful learning assistant. Answer the user's question clearly and concisely.",
        prompt,
      ]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  },

  async testApiKey(key) {
    try {
      const temp = new GoogleGenerativeAI(key);
      const model = temp.getGenerativeModel({ model: this.defaultModel });
      const result = await model.generateContent(
        "Respond with OK if you receive this.",
      );
      await result.response;
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
};
