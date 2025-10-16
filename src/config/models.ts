// Centralized Unreal AI model configuration
// Source of truth: aidocs/models.md and GET /v1/models

import { OPENAI_URL } from "@/config/unreal"

// Model identifiers are determined at runtime from /v1/models
export type UnrealModelId = string
// 10-minute in-memory cache for available models
const TEN_MIN = 10 * 60 * 1000
let _modelsCache: { models: UnrealModelId[]; expiresAt: number } | null = null

type ApiModelLike =
  | { id?: unknown; model?: unknown; name?: unknown }
  | string
  | null
  | undefined

const extractModelId = (m: ApiModelLike): string | undefined => {
  if (typeof m === "string") return m
  if (m && typeof m === "object") {
    const obj = m as { id?: unknown; model?: unknown; name?: unknown }
    const candidate = [obj.id, obj.model, obj.name].find(
      (v): v is string => typeof v === "string"
    )
    return candidate
  }
  return undefined
}

async function fetchModelsFromApi(auth?: string): Promise<UnrealModelId[]> {
  const headers: Record<string, string> = auth
    ? { Authorization: `Bearer ${auth}` }
    : {}
  const resp = await fetch(`${OPENAI_URL}/models`, {
    method: "GET",
    headers,
    credentials: "include",
  })
  if (!resp.ok) {
    // Return empty to allow callers to fallback to defaults
    return []
  }
  const data: unknown = await resp.json()

  let ids: string[] = []
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as Record<string, unknown>).data)
  ) {
    ids = ((data as Record<string, unknown>).data as unknown[])
      .map((m) => extractModelId(m as ApiModelLike))
      .filter((v): v is string => Boolean(v))
  } else if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as Record<string, unknown>).models)
  ) {
    ids = ((data as Record<string, unknown>).models as unknown[])
      .map((m) => extractModelId(m as ApiModelLike))
      .filter((v): v is string => Boolean(v))
  } else if (Array.isArray(data)) {
    ids = (data as unknown[])
      .map((m) => extractModelId(m as ApiModelLike))
      .filter((v): v is string => Boolean(v))
  }

  // De-duplicate
  const unique = Array.from(new Set(ids)) as UnrealModelId[]
  return unique
}

export async function getAvailableModels(
  auth?: string
): Promise<UnrealModelId[]> {
  const now = Date.now()
  if (
    _modelsCache &&
    _modelsCache.expiresAt > now &&
    _modelsCache.models.length > 0
  ) {
    return _modelsCache.models
  }
  try {
    const models = await fetchModelsFromApi(auth)
    if (models.length > 0) {
      _modelsCache = { models, expiresAt: now + TEN_MIN }
      return models
    }
  } catch (e) {
    // Swallow and fallback below
    console.warn("getAvailableModels: failed to fetch from API", e)
  }
  // Fallback to conservative default if API fails/empty
  _modelsCache = { models: [DEFAULT_MODEL], expiresAt: now + TEN_MIN }
  return _modelsCache.models
}

export function invalidateModelsCache(): void {
  _modelsCache = null
}

export const DEFAULT_MODEL: UnrealModelId = "gpt-4.1-mini"
export const CODING_MODEL: UnrealModelId = "qwen3-coder-480b-a35b-instruct"
