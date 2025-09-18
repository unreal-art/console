// Centralized Unreal AI model configuration
// Source of truth: aidocs/models.md and GET /v1/models

export type UnrealModelId =
  | "reel"
  | "reel-v1"
  | "r1-1776"
  | "flux-1-dev-fp8"
  | "llama4-scout-instruct-basic"
  | "llama4-maverick-instruct-basic"
  | "firesearch-ocr-v6"
  | "llama-v3p1-405b-instruct"
  | "mixtral-8x22b-instruct"
  | "flux-kontext-max"
  | "qwen3-coder-480b-a35b-instruct"
  | "qwen3-235b-a22b-instruct-2507"
  | "deepseek-r1-0528"
  | "deepseek-r1-basic"
  | "llama-v3p1-70b-instruct"
  | "llama-v3p3-70b-instruct"
  | "deepseek-r1"
  | "qwen3-30b-a3b"
  | "qwen3-30b-a3b-thinking-2507"
  | "glm-4p5"
  | "dobby-unhinged-llama-3-3-70b-new"
  | "flux-1-schnell-fp8"
  | "flux-kontext-pro"
  | "dobby-mini-unhinged-plus-llama-3-1-8b"
  | "deepseek-v3"
  | "qwen3-235b-a22b"
  | "kimi-k2-instruct"
  | "qwen2p5-vl-32b-instruct"
  | "playground-v2-5-1024px-aesthetic"

export const SUPPORTED_MODELS: Readonly<UnrealModelId[]> = [
  // "reel",
  // "reel-v1",
  "r1-1776",
  "flux-1-dev-fp8",
  "llama4-scout-instruct-basic",
  "llama4-maverick-instruct-basic",
  "firesearch-ocr-v6",
  "llama-v3p1-405b-instruct",
  "mixtral-8x22b-instruct",
  "flux-kontext-max",
  "qwen3-coder-480b-a35b-instruct",
  "qwen3-235b-a22b-instruct-2507",
  "deepseek-r1-0528",
  "deepseek-r1-basic",
  "llama-v3p1-70b-instruct",
  "llama-v3p3-70b-instruct",
  "deepseek-r1",
  "qwen3-30b-a3b",
  "qwen3-30b-a3b-thinking-2507",
  "glm-4p5",
  "dobby-unhinged-llama-3-3-70b-new",
  "flux-1-schnell-fp8",
  "flux-kontext-pro",
  "dobby-mini-unhinged-plus-llama-3-1-8b",
  "deepseek-v3",
  "qwen3-235b-a22b",
  "kimi-k2-instruct",
  "qwen2p5-vl-32b-instruct",
  // "playground-v2-5-1024px-aesthetic", //FIXME: later after UI support for image
] as const

export const DEFAULT_MODEL: UnrealModelId = "mixtral-8x22b-instruct"
export const CODING_MODEL: UnrealModelId =
  "qwen3-coder-480b-a35b-instruct"

export function isSupportedModel(model: string): model is UnrealModelId {
  return (SUPPORTED_MODELS as readonly string[]).includes(model)
}
