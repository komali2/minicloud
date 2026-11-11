export type ModelSpec = {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  keyEnv?: string;
  /** true = inference happens inside the customer's network. Nothing leaves. */
  local: boolean;
  jsonMode: boolean;
};

export const MODELS: ModelSpec[] = [
  {
    id: "deepseek",
    label: "DeepSeek V4 (hosted)",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    keyEnv: "DEEPSEEK_API_KEY",
    local: false,
    jsonMode: true,
  },
  {
    id: "local-devstral",
    label: "Devstral 24B — on-prem (RTX 5090)",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1",
    model: "devstral-small-2:latest",
    local: true,
    jsonMode: false,
  },
  {
    id: "local-qwen-coder",
    label: "Qwen3-Coder 30B — on-prem (RTX 5090)",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1",
    model: "hf.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF:Q5_K_M",
    local: true,
    jsonMode: false,
  },
];

export const defaultModelId = process.env.DEFAULT_MODEL ?? "deepseek";
export const getModel = (id: string) => MODELS.find((m) => m.id === id) ?? MODELS[0];
