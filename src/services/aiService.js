import { anthropicProvider } from "./providers/anthropicProvider";
import { geminiProvider } from "./providers/geminiProvider";

const providers = {
  gemini: geminiProvider,
  anthropic: anthropicProvider,
};

const STORAGE_KEY = "AI_PROVIDER";

function getProviderId() {
  return localStorage.getItem(STORAGE_KEY) || "gemini";
}

function getProvider() {
  return providers[getProviderId()];
}

function getModelStorageKey(providerId) {
  const p = providers[providerId] || getProvider();
  return p.storageKey.replace("_API_KEY", "_MODEL");
}

function providerInfo(p) {
  return {
    id: p.id,
    name: p.name,
    keyPrefix: p.keyPrefix,
    defaultModel: p.defaultModel,
    models: p.models,
  };
}

export function getProviders() {
  return Object.values(providers).map(providerInfo);
}

export function getCurrentProvider() {
  return providerInfo(getProvider());
}

export function getModels(providerId) {
  const p = providerId ? providers[providerId] : getProvider();
  return p ? p.models : [];
}

export function getCurrentModel() {
  const p = getProvider();
  const stored = localStorage.getItem(getModelStorageKey(p.id));
  return stored || p.defaultModel;
}

export function setCurrentModel(modelId) {
  const p = getProvider();
  localStorage.setItem(getModelStorageKey(p.id), modelId);
}

export function setProvider(id) {
  if (!providers[id]) return;
  localStorage.setItem(STORAGE_KEY, id);
  const key = localStorage.getItem(providers[id].storageKey);
  if (key) {
    providers[id].initialize(key);
  }
}

export function hasApiKey() {
  const p = getProvider();
  return !!localStorage.getItem(p.storageKey);
}

export function saveApiKey(key) {
  const p = getProvider();
  localStorage.setItem(p.storageKey, key);
  p.initialize(key);
}

export async function ask(prompt) {
  const p = getProvider();
  const key = localStorage.getItem(p.storageKey);
  if (!key) throw new Error("No API key available");
  p.initialize(key);
  const model = getCurrentModel();
  return p.ask(prompt, model);
}

export async function testApiKey(key) {
  const p = getProvider();
  return p.testApiKey(key);
}
