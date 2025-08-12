// Centralized Unreal AI model configuration
// Source of truth: aidocs/models.md and GET /v1/models

export type UnrealModelId =
  | 'unreal::reel'
  | 'unreal::reel-v1'
  | 'unreal::r1-1776'
  | 'unreal::flux-1-dev-fp8'
  | 'unreal::llama4-scout-instruct-basic'
  | 'unreal::llama4-maverick-instruct-basic'
  | 'unreal::firesearch-ocr-v6'
  | 'unreal::llama-v3p1-405b-instruct'
  | 'unreal::mixtral-8x22b-instruct'
  | 'unreal::flux-kontext-max'
  | 'unreal::qwen3-coder-480b-a35b-instruct'
  | 'unreal::qwen3-235b-a22b-instruct-2507'
  | 'unreal::deepseek-r1-0528'
  | 'unreal::deepseek-r1-basic'
  | 'unreal::llama-v3p1-70b-instruct'
  | 'unreal::llama-v3p3-70b-instruct'
  | 'unreal::deepseek-r1'
  | 'unreal::qwen3-30b-a3b'
  | 'unreal::qwen3-30b-a3b-thinking-2507'
  | 'unreal::glm-4p5'
  | 'unreal::dobby-unhinged-llama-3-3-70b-new'
  | 'unreal::flux-1-schnell-fp8'
  | 'unreal::flux-kontext-pro'
  | 'unreal::dobby-mini-unhinged-plus-llama-3-1-8b'
  | 'unreal::deepseek-v3'
  | 'unreal::qwen3-235b-a22b'
  | 'unreal::kimi-k2-instruct'
  | 'unreal::qwen2p5-vl-32b-instruct'
  | 'unreal::playground-v2-5-1024px-aesthetic';

export const SUPPORTED_MODELS: Readonly<UnrealModelId[]> = [
  'unreal::reel',
  'unreal::reel-v1',
  'unreal::r1-1776',
  'unreal::flux-1-dev-fp8',
  'unreal::llama4-scout-instruct-basic',
  'unreal::llama4-maverick-instruct-basic',
  'unreal::firesearch-ocr-v6',
  'unreal::llama-v3p1-405b-instruct',
  'unreal::mixtral-8x22b-instruct',
  'unreal::flux-kontext-max',
  'unreal::qwen3-coder-480b-a35b-instruct',
  'unreal::qwen3-235b-a22b-instruct-2507',
  'unreal::deepseek-r1-0528',
  'unreal::deepseek-r1-basic',
  'unreal::llama-v3p1-70b-instruct',
  'unreal::llama-v3p3-70b-instruct',
  'unreal::deepseek-r1',
  'unreal::qwen3-30b-a3b',
  'unreal::qwen3-30b-a3b-thinking-2507',
  'unreal::glm-4p5',
  'unreal::dobby-unhinged-llama-3-3-70b-new',
  'unreal::flux-1-schnell-fp8',
  'unreal::flux-kontext-pro',
  'unreal::dobby-mini-unhinged-plus-llama-3-1-8b',
  'unreal::deepseek-v3',
  'unreal::qwen3-235b-a22b',
  'unreal::kimi-k2-instruct',
  'unreal::qwen2p5-vl-32b-instruct',
  'unreal::playground-v2-5-1024px-aesthetic',
] as const;

export const DEFAULT_MODEL: UnrealModelId = 'unreal::mixtral-8x22b-instruct';

export function isSupportedModel(model: string): model is UnrealModelId {
  return (SUPPORTED_MODELS as readonly string[]).includes(model);
}
