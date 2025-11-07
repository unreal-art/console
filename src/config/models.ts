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

const isExcludedById = (id: string): boolean => {
  const lower = id.toLowerCase()
  if (lower.includes("embedding")) return true
  if (lower.includes("reel")) return true
  if (lower.includes("image") || lower.includes("img")) return true
  if (
    lower.includes("audio") ||
    lower.includes("speech") ||
    lower.includes("tts") ||
    lower.includes("whisper")
  )
    return true
  if (lower.includes("playground")) return true
  return false
}

const hasTextCapability = (m: ApiModelLike): boolean => {
  if (m && typeof m === "object") {
    const obj = m as Record<string, unknown>
    const modalities = obj.modalities as unknown
    if (
      Array.isArray(modalities) &&
      modalities.some((x) => String(x).toLowerCase() === "text")
    ) {
      return true
    }
    const caps = obj.capabilities as Record<string, unknown> | undefined
    if (caps && typeof caps === "object") {
      const chat = caps["chat"] === true
      const responses = caps["responses"] === true
      const text = (caps as Record<string, unknown>)["text"] === true
      if (chat || responses || text) return true
    }
    const id = extractModelId(m)
    if (id) return !isExcludedById(id)
    return false
  }
  if (typeof m === "string") {
    return !isExcludedById(m)
  }
  return false
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

  let items: unknown[] = []
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as Record<string, unknown>).data)
  ) {
    items = (data as Record<string, unknown>).data as unknown[]
  } else if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as Record<string, unknown>).models)
  ) {
    items = (data as Record<string, unknown>).models as unknown[]
  } else if (Array.isArray(data)) {
    items = data as unknown[]
  }

  const ids = items
    .filter((m) => hasTextCapability(m as ApiModelLike))
    .map((m) => extractModelId(m as ApiModelLike))
    .filter((v): v is string => Boolean(v))

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

export const DEFAULT_MODEL: UnrealModelId = "gpt-4o-mini"
export const CODING_MODEL: UnrealModelId = "gpt-4o-mini"
