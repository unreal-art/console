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
import { getChainById } from "@utils/web3/chains"

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
import { ExternalLink, Copy as CopyIcon } from "lucide-react"
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
  const { apiKey, token, getCurrentChainId, verifyData } = useApi()
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
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [modelOpen, setModelOpen] = useState(false)

  // Chain and run metadata for transparent billing
  const [chainId, setChainId] = useState<number | null>(null)
  type BillingMeta = {
    price?: string | number
    currency?: string
    txHash?: string
    requestId?: string | null
    headers?: Record<string, string>
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    }
    model?: string
    timestamp: number
  }
  const [lastRun, setLastRun] = useState<BillingMeta | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Pricing state from /v1/models/pricing
  type PricingEntry = {
    model: string
    category?: string
    input_unreal: number // UNREAL per 1M tokens
    output_unreal: number // UNREAL per 1M tokens
  }
  type PricingApiItem = {
    model?: unknown
    category?: unknown
    input_unreal?: unknown
    output_unreal?: unknown
  }
  type PricingApiResponse = {
    object?: unknown
    data?: PricingApiItem[]
  }
  const [pricing, setPricing] = useState<Record<string, PricingEntry>>({})
  const [isLoadingPricing, setIsLoadingPricing] = useState(false)
  const [pricingError, setPricingError] = useState<string | null>(null)

  // Simple id generator for UIMessage ids
  const makeId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  type TextPart = { type: "text"; text: string }

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  // Fetch current chain id for explorer links
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const id = await getCurrentChainId()
        if (mounted) setChainId(id)
      } catch (_e) {
        // ignore; fallback to null
      }
    })()
    return () => {
      mounted = false
    }
  }, [getCurrentChainId])

  // Helpers
  const getExplorerTxUrl = useCallback((id?: number | null, tx?: string | null) => {
    try {
      if (!id || !tx) return "#"
      const chain = getChainById(id) as unknown as {
        blockExplorers?: { default?: { url?: string } }
      }
      const base = (chain?.blockExplorers?.default?.url || "").replace(/\/$/, "")
      return base ? `${base}/tx/${tx}` : "#"
    } catch {
      return "#"
    }
  }, [])

  const short = (s?: string | null, head = 8, tail = 8) =>
    s && s.length > head + tail ? `${s.slice(0, head)}...${s.slice(-tail)}` : s ?? ""

  const copyToClipboard = async (t?: string | null) => {
    try {
      if (!t) return
      await navigator.clipboard.writeText(t)
    } catch (_e) {
      // noop
    }
  }

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
          credentials: "include",
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

  // Fetch pricing table (UNREAL per 1M tokens)
  useEffect(() => {
    const fetchPricing = async () => {
      setIsLoadingPricing(true)
      setPricingError(null)
      try {
        const auth = apiKey || token || ""
        const headers: Record<string, string> = auth
          ? { Authorization: `Bearer ${auth}` }
          : {}
        const resp = await fetch(`${OPENAI_URL}/models/pricing?sort=model`, {
          method: "GET",
          headers,
          credentials: "include",
        })
        if (!resp.ok) throw new Error(`Failed to fetch pricing (${resp.status})`)
        const json = (await resp.json()) as unknown
        let items: PricingApiItem[] = []
        if (
          json &&
          typeof json === "object" &&
          Array.isArray((json as PricingApiResponse).data)
        ) {
          items = ((json as PricingApiResponse).data as PricingApiItem[]) || []
        }
        const entries = items
          .map((d): PricingEntry | null => {
            const model = typeof d?.model === "string" ? (d.model as string) : undefined
            const input_unreal =
              typeof d?.input_unreal === "number" ? (d.input_unreal as number) : undefined
            const output_unreal =
              typeof d?.output_unreal === "number" ? (d.output_unreal as number) : undefined
            if (!model || input_unreal === undefined || output_unreal === undefined) return null
            const category = typeof d?.category === "string" ? (d.category as string) : undefined
            const obj: PricingEntry = category
              ? { model, category, input_unreal, output_unreal }
              : { model, input_unreal, output_unreal }
            return obj
          })
          .filter((v): v is NonNullable<typeof v> => v !== null)
        const map: Record<string, PricingEntry> = {}
        for (const e of entries) map[e.model] = e
        setPricing(map)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch pricing"
        setPricingError(msg)
      } finally {
        setIsLoadingPricing(false)
      }
    }
    void fetchPricing()
  }, [apiKey, token])

  // Helpers: pricing, estimate
  const getSelectedPricing = useCallback((): PricingEntry | undefined => {
    return pricing[model]
  }, [pricing, model])

  const per1k = (per1m?: number) =>
    typeof per1m === "number" ? per1m / 1000 : undefined

  const fmtNum = (n?: number) => {
    if (typeof n !== "number" || !isFinite(n)) return "—"
    if (n >= 1) return n.toFixed(3)
    if (n >= 0.01) return n.toFixed(4)
    return n.toPrecision(3)
  }

  const estimateTokens = (text: string) => {
    // Very rough heuristic: ~4 chars per token
    const t = Math.ceil(text.trim().length / 4)
    return isFinite(t) ? t : 0
  }

  const selectedPricing = getSelectedPricing()
  const estInputTokens = estimateTokens(input)
  const estInputCost =
    typeof selectedPricing?.input_unreal === "number"
      ? (selectedPricing.input_unreal * estInputTokens) / 1_000_000
      : undefined

  // Cost breakdown for the last run using pricing + usage
  const lastPricing = lastRun?.model ? pricing[lastRun.model] : undefined
  const inTokens = lastRun?.usage?.prompt_tokens ?? undefined
  const outTokens = lastRun?.usage?.completion_tokens ?? undefined
  const lastInCost =
    typeof lastPricing?.input_unreal === "number" && typeof inTokens === "number"
      ? (lastPricing.input_unreal * inTokens) / 1_000_000
      : undefined
  const lastOutCost =
    typeof lastPricing?.output_unreal === "number" && typeof outTokens === "number"
      ? (lastPricing.output_unreal * outTokens) / 1_000_000
      : undefined
  const lastTotalCost =
    typeof lastInCost === "number" && typeof lastOutCost === "number"
      ? lastInCost + lastOutCost
      : undefined

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
  const generateAssistantResponse = useCallback(
    async (history: UIMessage[]) => {
      setError(null)
      setIsStreaming(true)

      try {
        // Helper functions for retry logic
        const isTransient = (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err)
          return /unavailable|route to host|network|fetch failed|timeout|ECONNRESET|502|503|504/i.test(
            msg
          )
        }
        const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

        const maxAttempts = 3
        let attempt = 0
        let completion: OpenAI.Chat.ChatCompletion | null = null
        let headersCollected: Record<string, string> | null = null
        let requestId: string | null = null
        let parsedTxHash: string | undefined = undefined
        let parsedPrice: string | undefined = undefined
        let parsedCurrency: string | undefined = undefined
        let activeChainId: number | null = null

        // Capture current chain id for explorer linking
        try {
          activeChainId = await getCurrentChainId()
          setChainId(activeChainId)
        } catch (_e) {
          // ignore
        }

        for (; attempt < maxAttempts; attempt++) {
          try {
            // Set up abort controller for this attempt
            const controller = new AbortController()
            // Abort any ongoing request first
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
              // We intentionally allow browser usage here because the user provides their own key
              dangerouslyAllowBrowser: true,
              fetch: (input, init) => {
                return fetch(input as RequestInfo, {
                  ...(init || {}),
                  credentials: "include",
                })
              },
            })

            // Convert UI messages to OpenAI messages (text-only)
            const openaiMessages = history.map((m) => ({
              role: m.role as "system" | "user" | "assistant",
              content: getTextFromMessage(m),
            }))

            // Use non-streamed chat completions
            const result = await client.chat.completions
              .create(
                {
                  model,
                  messages: openaiMessages,
                  stream: false,
                },
                { signal: controller.signal }
              )
              .withResponse()

            completion = result.data

            // Collect headers for transparency panel
            const headersObj: Record<string, string> = {}
            try {
              result.response.headers.forEach((v, k) => {
                headersObj[String(k).toLowerCase()] = String(v)
              })
            } catch (_e) {
              // ignore header parsing errors
            }
            headersCollected = headersObj
            requestId = result.request_id

            // Best-effort parse of tx hash and price from headers
            const findKey = (re: RegExp) =>
              Object.keys(headersObj).find((k) => re.test(k))
            const txKey = findKey(/(tx|transaction)[-_]?hash/)
            const priceKey = findKey(/(price|cost)/)
            const currencyKey = findKey(/(currency|token|unit|symbol)/)
            parsedTxHash = txKey ? headersObj[txKey] : undefined
            parsedPrice = priceKey ? headersObj[priceKey] : undefined
            parsedCurrency = currencyKey ? headersObj[currencyKey] : undefined

            // Success - break out of retry loop
            break
          } catch (e) {
            const err = e as { name?: string; message?: string }
            const name = err?.name ?? ""
            const msgText =
              err?.message ?? (e instanceof Error ? e.message : String(e ?? ""))

            // Treat user-initiated or replacement aborts as non-errors.
            // OpenAI SDK throws APIUserAbortError; browsers may throw AbortError/DOMException.
            if (
              name === "AbortError" ||
              name === "APIUserAbortError" ||
              /abort(ed)?/i.test(msgText)
            ) {
              return
            }
            if (attempt < maxAttempts - 1 && isTransient(e)) {
              await sleep(500 * Math.pow(2, attempt))
              continue
            }
            throw e
          }
        }

        // Process the response
        if (completion && completion.choices && completion.choices.length > 0) {
          const assistantMessage = completion.choices[0].message
          if (assistantMessage && assistantMessage.content) {
            const newMessage: UIMessage = {
              id: makeId(),
              role: "assistant",
              parts: [{ type: "text", text: assistantMessage.content }],
            }
            setMessages((prev) => [...prev, newMessage])
          }

          // Record transparent billing metadata for this run
          setLastRun({
            price: parsedPrice,
            currency: parsedCurrency || "UNREAL",
            txHash: parsedTxHash,
            requestId,
            headers: headersCollected || undefined,
            usage: completion.usage,
            model: completion.model,
            timestamp: Date.now(),
          })
        }
      } catch (err) {
        console.error("Chat completion error:", err)
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
    [apiKey, token, model, getTextFromMessage, getCurrentChainId]
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
      void generateAssistantResponse(history)
    },
    [input, messages, generateAssistantResponse]
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

  // Actions
  const handleClear = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

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
    void generateAssistantResponse(history)
  }, [messages, getTextFromMessage, sendMessage, generateAssistantResponse])

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (lastUser) {
      setError(null)
      void sendMessage(getTextFromMessage(lastUser))
    }
  }, [messages, sendMessage, getTextFromMessage])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        (target?.isContentEditable ?? false)
      const key = e.key?.toLowerCase?.() ?? ""

      // Send message
      if ((e.metaKey || e.ctrlKey) && key === "enter") {
        if (isTyping) return // textarea has its own handler to prevent double-send
        e.preventDefault()
        void sendMessage()
        return
      }

      // Clear conversation
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault()
        handleClear()
        return
      }

      // Stop streaming
      if ((e.metaKey || e.ctrlKey) && key === ".") {
        e.preventDefault()
        if (isStreaming) stopStreaming()
        return
      }

      // Regenerate last
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && key === "r") {
        e.preventDefault()
        if (!isStreaming) regenerateLast()
        return
      }

      // Retry last
      if (e.altKey && key === "r") {
        e.preventDefault()
        if (!isStreaming) retryLast()
        return
      }

      // Open model select
      if ((e.metaKey || e.ctrlKey) && key === "m") {
        e.preventDefault()
        setModelOpen(true)
        return
      }

      // Focus input when not typing
      if (!isTyping && key === "/") {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }

      // Escape to stop or dismiss error
      if (key === "escape") {
        if (isStreaming) {
          e.preventDefault()
          stopStreaming()
          return
        }
        if (error) {
          e.preventDefault()
          setError(null)
          return
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [
    sendMessage,
    handleClear,
    isStreaming,
    stopStreaming,
    regenerateLast,
    retryLast,
    error,
  ])

  // Moved actions above

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Select
            value={model}
            onValueChange={(v) => setModel(v as UnrealModelId)}
            open={modelOpen}
            onOpenChange={setModelOpen}
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
          {/* Show per-1K pricing for selected model (UNREAL/1K tokens) */}
          {selectedPricing && (
            <div className="text-xs md:text-sm text-muted-foreground">
              <span className="mr-2">Pricing:</span>
              <span className="mr-2">In {fmtNum(per1k(selectedPricing.input_unreal))} UNREAL/1K</span>
              <span>Out {fmtNum(per1k(selectedPricing.output_unreal))} UNREAL/1K</span>
            </div>
          )}
          {!selectedPricing && pricingError && (
            <div className="text-xs md:text-sm text-muted-foreground">Pricing unavailable</div>
          )}
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
          <TooltipContent>Start a new conversation • Cmd/Ctrl+K</TooltipContent>
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
              <TooltipContent>
                Stop the current response • Cmd/Ctrl+.
              </TooltipContent>
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
              <TooltipContent>
                Regenerate the last response • Shift+Cmd/Ctrl+R
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Transparency panel: price, tx hash, usage, request id */}
      {lastRun && (
        <div className="mb-4 rounded-md border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
            <Badge variant="secondary">Transparency</Badge>
            {typeof verifyData?.remaining === "number" && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">{verifyData.remaining.toLocaleString()}</span>
              </div>
            )}
            {lastRun.usage && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Usage</span>
                <span className="font-medium">
                  {lastRun.usage.prompt_tokens ?? 0} in · {lastRun.usage.completion_tokens ?? 0} out · {lastRun.usage.total_tokens ?? ((lastRun.usage.prompt_tokens ?? 0) + (lastRun.usage.completion_tokens ?? 0))} total
                </span>
              </div>
            )}
            {lastRun.price && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">{String(lastRun.price)} {lastRun.currency || "UNREAL"}</span>
              </div>
            )}
            {/* Show computed cost breakdown when pricing table + usage are available */}
            {typeof lastTotalCost === "number" && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Est. Cost</span>
                <span className="font-medium">
                  In {fmtNum(lastInCost)} · Out {fmtNum(lastOutCost)} · Total {fmtNum(lastTotalCost)} UNREAL
                </span>
              </div>
            )}
            {lastRun.txHash && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Tx</span>
                <a
                  href={getExplorerTxUrl(chainId, lastRun.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono hover:underline"
                  title={lastRun.txHash}
                >
                  {short(lastRun.txHash)} <ExternalLink className="ml-1 inline h-3 w-3" />
                </a>
              </div>
            )}
            {lastRun.requestId && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">ReqID</span>
                <button
                  type="button"
                  onClick={() => void copyToClipboard(lastRun.requestId || undefined)}
                  className="font-mono underline-offset-2 hover:underline"
                  title="Copy request id"
                >
                  {short(lastRun.requestId)}
                </button>
                <button
                  type="button"
                  onClick={() => void copyToClipboard(lastRun.requestId || undefined)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Copy request id"
                  title="Copy request id"
                >
                  <CopyIcon className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="ml-auto">
              <Button variant="ghost" size="sm" onClick={() => setShowDetails((s) => !s)}>
                {showDetails ? "Hide details" : "Show details"}
              </Button>
            </div>
          </div>
          {showDetails && (
            <div className="mt-2 max-h-64 overflow-auto rounded bg-background/50 p-2">
              <pre className="text-[11px] leading-tight">
                {JSON.stringify(
                  { model: lastRun.model, usage: lastRun.usage, headers: lastRun.headers },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}

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
                title="Retry (Alt+R)"
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
                title="Dismiss (Esc)"
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
          ref={inputRef}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault()
              void sendMessage()
            }
          }}
        />
        {/* Predictive estimate for input tokens and cost */}
        {selectedPricing && input.trim().length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Est. input tokens: <span className="font-medium">{estInputTokens.toLocaleString()}</span>
            </div>
            <div>
              Est. input cost: <span className="font-medium">{fmtNum(estInputCost)} UNREAL</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-end">
          <Button
            onClick={() => void sendMessage()}
            disabled={isStreaming || !input.trim()}
            title="Send (Cmd/Ctrl+Enter)"
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
