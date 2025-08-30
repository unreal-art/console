import React, { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useApi } from "@/lib/ApiContext"
import { OPENAI_URL } from "@/config/unreal"
import {
  DEFAULT_MODEL,
  SUPPORTED_MODELS,
  isSupportedModel,
} from "@/config/models"
import type { UnrealModelId } from "@/config/models"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  AlertCircle,
  Loader2,
  Send,
  Trash2,
  Square,
  RotateCcw,
} from "lucide-react"
import OpenAI from "openai"
import type { UIMessage } from "ai"

interface ChatPlaygroundProps {
  initialPrompt?: string
  autorun?: boolean
}

const ChatPlayground: React.FC<ChatPlaygroundProps> = ({
  initialPrompt,
  autorun,
}) => {
  const { apiKey, token } = useApi()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<UIMessage[]>([])
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const [model, setModel] = useState<UnrealModelId>(DEFAULT_MODEL)
  const [availableModels, setAvailableModels] = useState<UnrealModelId[]>([
    ...SUPPORTED_MODELS,
  ])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Simple id generator for UIMessage ids
  const makeId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  type TextPart = { type: "text"; text?: string }

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  // Dynamically fetch models from API and filter to allowlist
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true)
      try {
        const auth = apiKey || token || ""
        const headers: Record<string, string> = auth
          ? { Authorization: `Bearer ${auth}` }
          : {}
        const response = await fetch(`${OPENAI_URL}/models`, {
          method: "GET",
          headers,
        })
        if (!response.ok) return // fallback silently
        const data: unknown = await response.json()

        // Extract ids from multiple possible shapes
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

        const filtered = ids.filter(isSupportedModel) as UnrealModelId[]
        if (filtered.length > 0) {
          setAvailableModels(filtered)
          setModel((prev) =>
            filtered.includes(prev) ? prev : filtered[0] ?? DEFAULT_MODEL
          )
        }
      } catch (err) {
        console.warn("Failed to fetch models, using static list", err)
      } finally {
        setIsLoadingModels(false)
      }
    }

    fetchModels()
  }, [apiKey, token])

  // Helper to extract plain text from a UI message (only text parts for now)
  const getTextFromMessage = useCallback((m: UIMessage): string => {
    const parts = (m as unknown as { parts?: TextPart[] }).parts
    if (!Array.isArray(parts)) return ""
    return parts
      .filter((p): p is TextPart => Boolean(p) && p.type === "text")
      .map((p) => p.text ?? "")
      .join("")
  }, [])

  // Stream assistant response for the given history (messages already include last user)
  const streamAssistantResponse = useCallback(
    async (history: UIMessage[]) => {
      setError(null)
      setIsStreaming(true)

      // Append assistant placeholder
      setMessages(() => [
        ...history,
        {
          id: makeId(),
          role: "assistant",
          parts: [{ type: "text", text: "" }],
        } as UIMessage,
      ])

      try {
        const isTransient = (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err)
          return /unavailable|route to host|network|fetch failed|timeout|ECONNRESET|502|503|504/i.test(
            msg
          )
        }
        const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

        const maxAttempts = 3
        let attempt = 0
        for (; attempt < maxAttempts; attempt++) {
          try {
            // Set up abort controller for this attempt
            const controller = new AbortController()
            // Abort any ongoing stream first
            try {
              abortRef.current?.abort()
            } catch (_e) {
              // ignore if nothing to abort
            }
            abortRef.current = controller

            const auth = apiKey || token || ""
            const client = new OpenAI({
              apiKey: auth,
              baseURL: OPENAI_URL,
              // We intentionally allow browser usage here because the user provides their own key/token
              dangerouslyAllowBrowser: true,
            })

            // Convert UI messages to provider messages (text-only)
            const providerMessages = history.map((m) => ({
              role: m.role as "system" | "user" | "assistant",
              content: getTextFromMessage(m),
            }))

            const stream = await client.responses.stream(
              {
                model,
                messages: providerMessages,
                stream: true,
              },
              { signal: controller.signal }
            )

            for await (const chunk of stream) {
              // Support both Chat Completions-style and Responses API streaming events
              let delta: string | undefined
              const c: any = chunk as any
              if (c?.choices?.[0]?.delta?.content) {
                delta = c.choices[0].delta.content
              } else if (typeof c === "string") {
                delta = c
              } else if (typeof c?.delta === "string") {
                delta = c.delta
              } else if (
                c?.type === "response.output_text.delta" &&
                typeof c?.delta === "string"
              ) {
                delta = c.delta
              } else if (
                c?.type === "response.delta" &&
                typeof c?.delta?.output_text === "string"
              ) {
                delta = c.delta.output_text
              }
              if (!delta) continue
              setMessages((prev) => {
                if (prev.length === 0) return prev
                const next = prev.slice()
                const last = next[next.length - 1]
                const lastParts = (last as unknown as { parts?: TextPart[] })
                  .parts
                if (
                  last.role === "assistant" &&
                  Array.isArray(lastParts) &&
                  lastParts.length
                ) {
                  const updated: TextPart[] = [...lastParts]
                  updated[0] = {
                    ...updated[0],
                    text: String((updated[0]?.text || "") + delta),
                  }
                  next[next.length - 1] = {
                    ...last,
                    parts: updated,
                  } as UIMessage
                } else {
                  next.push({
                    id: makeId(),
                    role: "assistant",
                    parts: [{ type: "text", text: String(delta) } as TextPart],
                  } as UIMessage)
                }
                return next
              })
            }
            // Success
            break
          } catch (e) {
            const err = e as { name?: string }
            if (err?.name === "AbortError") {
              // Aborted by user; do not set error
              return
            }
            if (attempt < maxAttempts - 1 && isTransient(e)) {
              await sleep(500 * Math.pow(2, attempt))
              continue
            }
            throw e
          }
        }
      } catch (err) {
        console.error("Streaming chat error:", err)
        const msg =
          err instanceof Error
            ? err.message
            : "Request failed. Please try again."
        let status: number | undefined = undefined
        if (err && typeof err === "object") {
          const maybe = err as { status?: unknown; response?: unknown }
          if (typeof maybe.status === "number") {
            status = maybe.status
          } else if (maybe.response && typeof maybe.response === "object") {
            const resp = maybe.response as { status?: unknown }
            if (typeof resp.status === "number") status = resp.status
          }
        }
        const text = String(msg || "")
        const unauthorized = status === 401 || /401|unauthorized/i.test(text)
        setError(
          unauthorized
            ? "Unauthorized. Please sign in or create an API key in Settings."
            : msg
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [apiKey, token, model, getTextFromMessage]
  )

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim()
      if (!content) return

      // Add user message to history, then stream assistant response
      const userMessage: UIMessage = {
        id: makeId(),
        role: "user",
        parts: [{ type: "text", text: content }],
      }
      setInput("")
      const history = [...messages, userMessage]
      setMessages(history)
      void streamAssistantResponse(history)
    },
    [input, messages, streamAssistantResponse]
  )

  // Autorun with initialPrompt if provided
  useEffect(() => {
    if (autorun && initialPrompt) {
      const t = setTimeout(() => {
        void sendMessage(initialPrompt)
      }, 100)
      return () => clearTimeout(t)
    }
  }, [autorun, initialPrompt, sendMessage])

  const handleClear = () => {
    setMessages([])
    setError(null)
  }

  const stopStreaming = useCallback(() => {
    try {
      abortRef.current?.abort()
    } catch (_e) {
      // ignore if nothing to abort
    }
    setIsStreaming(false)
  }, [])

  const regenerateLast = useCallback(() => {
    // Find last assistant message and remove it, keep history up to last user
    const lastAssistantIndex = [...messages]
      .map((m, i) => ({ role: m.role, i }))
      .reduce((acc, cur) => (cur.role === "assistant" ? cur.i : acc), -1)
    if (lastAssistantIndex === -1) {
      // Fallback: retry using the last user message
      const lastUser = [...messages].reverse().find((m) => m.role === "user")
      if (lastUser) {
        setError(null)
        void sendMessage(getTextFromMessage(lastUser))
      }
      return
    }
    const history = messages.slice(0, lastAssistantIndex)
    setError(null)
    setMessages(history)
    void streamAssistantResponse(history)
  }, [messages, getTextFromMessage, sendMessage, streamAssistantResponse])

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (lastUser) {
      setError(null)
      void sendMessage(getTextFromMessage(lastUser))
    }
  }, [messages, sendMessage, getTextFromMessage])

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Select
            value={model}
            onValueChange={(v) => setModel(v as UnrealModelId)}
          >
            <SelectTrigger
              className="w-[260px]"
              disabled={isLoadingModels || availableModels.length === 0}
            >
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="hidden md:inline-flex">
            {model}
          </Badge>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={messages.length === 0 || isStreaming}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </TooltipTrigger>
          <TooltipContent>Start a new conversation</TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={stopStreaming}>
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop the current response</TooltipContent>
            </Tooltip>
          )}
          {!isStreaming && messages.some((m) => m.role === "assistant") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regenerateLast}
                  disabled={messages.length === 0}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </TooltipTrigger>
              <TooltipContent>Regenerate the last response</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {error && (
        <Alert className="mb-4 border-red-500 bg-red-500/15">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-3">
            <span className="truncate">{error}</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={retryLast}
                disabled={isStreaming}
              >
                Try again
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/settings")}
              >
                Go to Settings
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setError(null)}
                disabled={isStreaming}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div
        ref={scrollRef}
        className="space-y-3 mb-4 h-[60vh] md:h-[70vh] overflow-y-auto p-2"
      >
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-10">
            Send a message to get started
          </div>
        )}
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${
              m.role === "user"
                ? "bg-blue-100 dark:bg-blue-900/30 ml-8"
                : "bg-gray-100 dark:bg-gray-800 mr-8"
            }`}
          >
            <p className="text-xs font-semibold mb-1">
              {m.role === "user" ? "You" : "Assistant"}
            </p>
            <p className="whitespace-pre-wrap break-words">
              {(m as unknown as { parts?: TextPart[] }).parts
                ?.filter((p): p is TextPart => Boolean(p) && p.type === "text")
                .map((p) => p.text ?? "")
                .join("")}
            </p>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Message the model..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="resize-none min-h-[100px]"
          disabled={isStreaming}
        />
        <div className="flex items-center justify-end">
          <Button
            onClick={() => void sendMessage()}
            disabled={isStreaming || !input.trim()}
          >
            {isStreaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChatPlayground
