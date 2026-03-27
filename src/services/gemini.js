import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

export const initializeGemini = (apiKey) => {
  genAI = new GoogleGenerativeAI(apiKey);
};

export const hasApiKey = () => {
  const key = localStorage.getItem("GEMINI_API_KEY");
  if (key && !genAI) {
    initializeGemini(key);
  }
  return !!genAI || !!key;
};

export const saveApiKey = (key) => {
  localStorage.setItem("GEMINI_API_KEY", key);
  initializeGemini(key);
};

export const askGemini = async (prompt) => {
  if (!genAI) {
    if (!hasApiKey()) {
      throw new Error("No API key available");
    }
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      "You are a helpful learning assistant. Answer the user's question clearly and concisely.",
      prompt
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const testApiKey = async (key) => {
  try {
    const tempGenAI = new GoogleGenerativeAI(key);
    const model = tempGenAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Respond with OK if you receive this.");
    await result.response;
    return true;
  } catch (error) {
    return false;
  }
};
