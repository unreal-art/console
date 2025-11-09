import React, { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"

import { useApi } from "@/lib/ApiContext"
import { OPENAI_URL } from "@/config/unreal"
import {
  DEFAULT_MODEL,
  getAvailableModels,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  AlertCircle,
  Loader2,
  Send,
  Trash2,
  Square,
  RotateCcw,
} from "lucide-react"
import {
  ExternalLink,
  Copy as CopyIcon,
  FileJson,
  FileDown,
  List,
} from "lucide-react"
import OpenAI from "openai"
import type { UIMessage } from "ai"
import { Switch } from "@/components/ui/switch"

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
    DEFAULT_MODEL,
  ])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [modelOpen, setModelOpen] = useState(false)
  const [outputGuess, setOutputGuess] = useState<number>(300)
  const [enableStreaming, setEnableStreaming] = useState(false)

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
    // New explicit metadata parsed from headers
    headerCosts?: { input?: number; output?: number; total?: number }
    priceTx?: { hash?: string; url?: string }
    costTx?: { hash?: string; url?: string }
    refund?: { amount?: number; tx?: { hash?: string; url?: string } }
    paymentTokenUrl?: string
    chain?: { id?: number; name?: string }
    callsRemaining?: number
  }
  const [lastRun, setLastRun] = useState<BillingMeta | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [expandedHash, setExpandedHash] = useState<{
    type: 'price' | 'cost' | 'refund'
    hash: string
  } | null>(null)
  
  // Toggle hash expansion
  const toggleHashExpansion = (type: 'price' | 'cost' | 'refund', hash: string) => {
    if (expandedHash?.type === type && expandedHash.hash === hash) {
      setExpandedHash(null)
    } else {
      setExpandedHash({ type, hash })
    }
  }
  
  // Component for expandable hash display
  const ExpandableHash = ({
    hash,
    url,
    type,
  }: {
    hash: string
    url?: string
    type: 'price' | 'cost' | 'refund'
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1">
          <span
            className="font-mono cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              toggleHashExpansion(type, hash)
            }}
          >
            {expandedHash?.type === type && expandedHash.hash === hash
              ? hash
              : shortHash(hash)}
          </span>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              title="View on explorer"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {expandedHash?.type === type && expandedHash.hash === hash
          ? 'Click to collapse'
          : 'Click to expand'}
      </TooltipContent>
    </Tooltip>
  )

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
  const getExplorerTxUrl = useCallback(
    (id?: number | null, tx?: string | null) => {
      try {
        if (!id || !tx) return "#"
        const chain = getChainById(id) as unknown as {
          blockExplorers?: { default?: { url?: string } }
        }
        const base = (chain?.blockExplorers?.default?.url || "").replace(
          /\/$/,
          ""
        )
        return base ? `${base}/tx/${tx}` : "#"
      } catch {
        return "#"
      }
    },
    []
  )

  const short = (s?: string | null, head = 8, tail = 8) =>
    s && s.length > head + tail
      ? `${s.slice(0, head)}...${s.slice(-tail)}`
      : s ?? ""

  const shortHash = (s?: string | null, head = 4, tail = 4) =>
    s && s.length > head + tail
      ? `${s.slice(0, head)}...${s.slice(-tail)}`
      : s ?? ""

  const copyToClipboard = async (t?: string | null) => {
    try {
      if (!t) return
      await navigator.clipboard.writeText(t)
    } catch (_e) {
      // noop
    }
  }

  // Dynamically fetch models from API using shared 10-minute cache
  useEffect(() => {
    const load = async () => {
      setIsLoadingModels(true)
      try {
        const auth = apiKey || token || ""
        const models = await getAvailableModels(auth)
        if (models && models.length > 0) {
          setAvailableModels(models as UnrealModelId[])
          setModel((prev) =>
            (models as string[]).includes(prev)
              ? prev
              : (models[0] as UnrealModelId)
          )
        }
      } catch (err) {
        console.warn("Failed to load models", err)
      } finally {
        setIsLoadingModels(false)
      }
    }
    void load()
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
        if (!resp.ok)
          throw new Error(`Failed to fetch pricing (${resp.status})`)
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
            const model =
              typeof d?.model === "string" ? (d.model as string) : undefined
            const input_unreal =
              typeof d?.input_unreal === "number"
                ? (d.input_unreal as number)
                : undefined
            const output_unreal =
              typeof d?.output_unreal === "number"
                ? (d.output_unreal as number)
                : undefined
            if (
              !model ||
              input_unreal === undefined ||
              output_unreal === undefined
            )
              return null
            const category =
              typeof d?.category === "string"
                ? (d.category as string)
                : undefined
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

  const fmtOrDash = (v?: string | number | null) =>
    v === undefined || v === null || v === "" ? "-" : String(v)

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
  const estOutputCost =
    typeof selectedPricing?.output_unreal === "number"
      ? (selectedPricing.output_unreal * outputGuess) / 1_000_000
      : undefined
  const estTotalCost =
    typeof estInputCost === "number" && typeof estOutputCost === "number"
      ? estInputCost + estOutputCost
      : undefined

  // Cost breakdown for the last run using pricing + usage
  const lastPricing = lastRun?.model ? pricing[lastRun.model] : undefined
  const inTokens = lastRun?.usage?.prompt_tokens ?? undefined
  const outTokens = lastRun?.usage?.completion_tokens ?? undefined
  const lastInCost =
    typeof lastPricing?.input_unreal === "number" &&
    typeof inTokens === "number"
      ? (lastPricing.input_unreal * inTokens) / 1_000_000
      : undefined
  const lastOutCost =
    typeof lastPricing?.output_unreal === "number" &&
    typeof outTokens === "number"
      ? (lastPricing.output_unreal * outTokens) / 1_000_000
      : undefined
  const lastTotalCost =
    typeof lastInCost === "number" && typeof lastOutCost === "number"
      ? lastInCost + lastOutCost
      : undefined

  // Prefer header-reported costs if present
  const dispInCost =
    typeof lastRun?.headerCosts?.input === "number"
      ? lastRun.headerCosts.input
      : lastInCost
  const dispOutCost =
    typeof lastRun?.headerCosts?.output === "number"
      ? lastRun.headerCosts.output
      : lastOutCost
  const dispTotalCost =
    typeof lastRun?.headerCosts?.total === "number"
      ? lastRun.headerCosts.total
      : typeof dispInCost === "number" && typeof dispOutCost === "number"
      ? dispInCost + dispOutCost
      : lastTotalCost

  // Optional: UNREAL -> Fiat conversion via env (1 UNREAL = $0.01 default)
  const envObj = (import.meta as unknown as { env?: Record<string, unknown> })
    .env
  const parsedUnrealUsd =
    typeof envObj?.VITE_UNREAL_USD === "string"
      ? Number(envObj.VITE_UNREAL_USD as string)
      : NaN
  const unrealFiatRate = Number.isFinite(parsedUnrealUsd)
    ? parsedUnrealUsd
    : 0.01
  const fiatCode =
    typeof envObj?.VITE_FIAT_CODE === "string"
      ? (envObj.VITE_FIAT_CODE as string)
      : "USD"
  const hasFiat = Number.isFinite(unrealFiatRate) && unrealFiatRate > 0
  const toFiat = (v?: number) =>
    hasFiat && typeof v === "number"
      ? v * (unrealFiatRate as number)
      : undefined

  const estInputFiat = toFiat(estInputCost)
  const estOutputFiat = toFiat(estOutputCost)
  const estTotalFiat = toFiat(estTotalCost)
  const lastInFiat = toFiat(dispInCost)
  const lastOutFiat = toFiat(dispOutCost)
  const lastTotalFiat = toFiat(dispTotalCost)

  // Receipt export helpers
  const buildReceipt = useCallback(() => {
    if (!lastRun) return null
    const obj = {
      timestamp: lastRun.timestamp,
      isoTime: new Date(lastRun.timestamp).toISOString(),
      model: lastRun.model,
      usage: lastRun.usage,
      headers: lastRun.headers,
      requestId: lastRun.requestId,
      txHash: lastRun.txHash,
      priceTx: lastRun.priceTx,
      costTx: lastRun.costTx,
      refund: lastRun.refund,
      paymentTokenUrl: lastRun.paymentTokenUrl,
      headerPrice: lastRun.price,
      headerCurrency: lastRun.currency,
      computed: {
        inTokens: inTokens ?? null,
        outTokens: outTokens ?? null,
        inCostUNREAL: dispInCost ?? null,
        outCostUNREAL: dispOutCost ?? null,
        totalCostUNREAL: dispTotalCost ?? null,
        inCostFiat: lastInFiat ?? null,
        outCostFiat: lastOutFiat ?? null,
        totalCostFiat: lastTotalFiat ?? null,
        fiatCode: hasFiat ? fiatCode : null,
      },
    }
    return obj
  }, [
    lastRun,
    inTokens,
    outTokens,
    dispInCost,
    dispOutCost,
    dispTotalCost,
    lastInFiat,
    lastOutFiat,
    lastTotalFiat,
    hasFiat,
    fiatCode,
  ])

  const downloadFile = (name: string, content: string, mime: string) => {
    try {
      const blob = new Blob([content], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (_e) {
      // ignore
    }
  }

  const exportJson = useCallback(() => {
    const receipt = buildReceipt()
    if (!receipt) return
    const fname = `receipt_${receipt.model || "model"}_${
      receipt.timestamp
    }.json`
    downloadFile(fname, JSON.stringify(receipt, null, 2), "application/json")
  }, [buildReceipt])

  const exportCsv = useCallback(() => {
    const receipt = buildReceipt() as ReturnType<typeof buildReceipt> & {
      [k: string]: unknown
    }
    if (!receipt) return
    const flat = {
      timestamp: receipt.timestamp,
      isoTime: receipt.isoTime,
      model: receipt.model ?? "",
      prompt_tokens: receipt.usage?.prompt_tokens ?? "",
      completion_tokens: receipt.usage?.completion_tokens ?? "",
      total_tokens: receipt.usage?.total_tokens ?? "",
      in_cost_unreal: receipt.computed.inCostUNREAL ?? "",
      out_cost_unreal: receipt.computed.outCostUNREAL ?? "",
      total_cost_unreal: receipt.computed.totalCostUNREAL ?? "",
      in_cost_fiat: receipt.computed.inCostFiat ?? "",
      out_cost_fiat: receipt.computed.outCostFiat ?? "",
      total_cost_fiat: receipt.computed.totalCostFiat ?? "",
      fiat_code: receipt.computed.fiatCode ?? "",
      tx_hash: receipt.txHash ?? "",
      request_id: receipt.requestId ?? "",
      header_price: receipt.headerPrice ?? "",
      header_currency: receipt.headerCurrency ?? "",
    }
    const headers = Object.keys(flat)
    const csvEsc = (val: unknown) => {
      const s = String(val ?? "")
      // Guard against CSV injection
      const needsFormulaEscape = /^[=+\-@]/.test(s)
      const safe = needsFormulaEscape ? `'${s}` : s
      return `"${safe.replace(/"/g, '""')}"`
    }
    const values = headers.map((k) => csvEsc((flat as Record<string, unknown>)[k]))
    const csv = `${headers.join(",")}\n${values.join(",")}`
    const fname = `receipt_${receipt.model || "model"}_${receipt.timestamp}.csv`
    downloadFile(fname, csv, "text/csv")
  }, [buildReceipt])

  // Helper to extract plain text from a UI message (only text parts for now)
  const getTextFromMessage = useCallback((m: UIMessage): string => {
    const parts = (m as unknown as { parts?: TextPart[] }).parts
    if (!Array.isArray(parts)) return ""
    return parts
      .filter((p): p is TextPart => Boolean(p) && p.type === "text")
      .map((p) => p.text ?? "")
      .join("")
  }, [])

  const extractOutputText = useCallback((data: unknown): string => {
    try {
      const d = data as Record<string, unknown> | null | undefined
      if (!d || typeof d !== "object") return ""

      // OpenAI Responses API convenience field
      const outputText = (d as { output_text?: unknown }).output_text
      if (typeof outputText === "string" && outputText.length > 0) return outputText

      // OpenAI Responses API structured output
      const output = (d as { output?: unknown }).output
      if (Array.isArray(output) && output.length > 0) {
        const first = output[0] as { content?: unknown }
        const content = first?.content
        if (Array.isArray(content)) {
          const text = content
            .map((c) => {
              const item = c as { type?: unknown; text?: unknown; content?: unknown }
              if (item && item.type === "output_text") {
                const t = (item.text as { value?: unknown } | undefined)?.value
                return typeof t === "string" ? t : ""
              }
              if (typeof item?.text === "string") return item.text as string
              if (typeof item?.content === "string") return item.content as string
              return ""
            })
            .join("")
          if (text) return text
        }
      }

      // Chat Completions style (e.g., GitHub Models)
      const choices = (d as { choices?: unknown }).choices
      if (Array.isArray(choices) && choices.length > 0) {
        const c0 = choices[0] as {
          message?: { content?: unknown }
          text?: unknown
        }
        const msg = c0?.message?.content
        if (typeof msg === "string") return msg
        if (Array.isArray(msg)) {
          const txt = msg
            .map((p) => {
              const part = p as { text?: unknown }
              if (typeof part?.text === "string") return part.text
              if (typeof (p as unknown as string) === "string") return p as unknown as string
              return ""
            })
            .join("")
          if (txt) return txt
        }
        if (typeof c0?.text === "string") return c0.text
      }

      // Fallback fields
      const content = (d as { content?: unknown }).content
      if (typeof content === "string") return content

      return ""
    } catch {
      return ""
    }
  }, [])

  // Stream assistant response for the given history (messages already include last user)
  const generateAssistantResponse = useCallback(
    async (history: UIMessage[]) => {
      setError(null)
      setIsStreaming(true)

      // Streaming mode (beta) using native fetch + SSE
      if (enableStreaming) {
        // Track whether we've received any streamed content
        let hasStreamed = false
        // Helper to append streamed text to the placeholder assistant message
        const appendChunk = (assistantIndex: number, chunk: string) => {
          if (!chunk) return
          hasStreamed = true
          setMessages((prev) => {
            const next = [...prev]
            const current = next[assistantIndex]
            if (!current || current.role !== "assistant") return prev
            const existing = (current as unknown as { parts?: TextPart[] }).parts || []
            const existingText = existing
              .filter((p): p is TextPart => Boolean(p) && p.type === "text")
              .map((p) => p.text ?? "")
              .join("")
            const updated: UIMessage = {
              ...current,
              parts: [{ type: "text", text: existingText + chunk }],
            }
            next[assistantIndex] = updated
            return next
          })
        }

        try {
          // Abort setup
          const controller = new AbortController()
          try {
            abortRef.current?.abort()
          } catch (_e) {
            // ignore: no active request to abort
            void _e
          }
          abortRef.current = controller

          // Capture chain for explorer links
          try {
            const id = await getCurrentChainId()
            setChainId(id)
          } catch (_e) {
            // ignore chain fetch errors
            void _e
          }

          // Prepare request
          const auth = apiKey || token || ""
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          }
          if (auth) headers["Authorization"] = `Bearer ${auth}`

          const openaiMessages = history.map((m) => ({
            role: m.role as "system" | "user" | "assistant",
            content: getTextFromMessage(m),
          }))

          // Add placeholder assistant message
          const assistantIndex = history.length
          setMessages((prev) => [
            ...history,
            { id: makeId(), role: "assistant", parts: [{ type: "text", text: "" }] },
          ])

          const resp = await fetch(`${OPENAI_URL}/responses`, {
            method: "POST",
            headers,
            credentials: "include",
            signal: controller.signal,
            body: JSON.stringify({
              model,
              instructions: openaiMessages.find(m => m.role === "system")?.content || "You are a helpful assistant.",
              input: openaiMessages.filter(m => m.role !== "system").map(m => `${m.role}: ${m.content}`).join("\n"),
              stream: true,
            }),
          })

          if (!resp.ok || !resp.body) {
            let msg = `Streaming request failed (${resp.status})`
            try {
              const t = await resp.text()
              if (t) msg = `${msg}: ${t}`
            } catch (_e) {
              // ignore body read error
              void _e
            }
            throw new Error(msg)
          }

          // Collect headers for transparency
          const headersObj: Record<string, string> = {}
          try {
            resp.headers.forEach((v, k) => {
              headersObj[String(k).toLowerCase()] = String(v)
            })
          } catch (_e) {
            // ignore header iteration errors
            void _e
          }

          // Parse explicit headers for price/cost and transactions
          const num = (s?: string) => {
            if (s == null) return undefined
            const n = Number(s)
            return Number.isFinite(n) ? n : undefined
          }
          const headerInputCost = num(headersObj["openai-input-cost"]) // UNREAL
          const headerOutputCost = num(headersObj["openai-output-cost"]) // UNREAL
          const headerTotalCost = num(headersObj["openai-total-cost"]) // UNREAL
          const priceTxHash = headersObj["openai-price-tx"]
          const priceTxUrl = headersObj["openai-price-tx-url"]
          const costTxHash = headersObj["openai-cost-tx"]
          const costTxUrl = headersObj["openai-cost-tx-url"]
          const refundAmount = num(headersObj["openai-refund-amount"]) // UNREAL
          const refundTxHash = headersObj["openai-refund-tx"]
          const refundTxUrl = headersObj["openai-refund-tx-url"]
          const paymentTokenUrl = headersObj["openai-payment-token"]
          const chainName = headersObj["openai-chain"]
          const chainIdHeader = headersObj["openai-chain-id"]
          const chainIdParsed = chainIdHeader
            ? Number.isFinite(Number(chainIdHeader))
              ? Number(chainIdHeader)
              : undefined
            : undefined
          const callsRemaining = num(headersObj["openai-calls-remaining"]) ?? undefined
          const requestIdHeader =
            headersObj["x-request-id"] || headersObj["openai-request-id"] || null

          // Stream parse (SSE)
          const reader = resp.body.getReader()
          const decoder = new TextDecoder("utf-8")
          let buffer = ""
          let modelSeen: string | undefined
          const flushEvents = (block: string) => {
            const lines = block.split("\n")
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith("data:")) continue
              const data = trimmed.slice(5).trim()
              if (!data) continue
              if (data === "[DONE]") return "DONE" as const
              try {
                const json = JSON.parse(data) as {
                  type?: string
                  delta?: string
                  model?: string
                  choices?: Array<{
                    delta?: { content?: string }
                    text?: string
                    message?: { content?: string }
                  }>
                }
                if (json?.model && !modelSeen) modelSeen = json.model
                let plain = ""
                if (json?.type === "response.output_text.delta" && typeof json.delta === "string") {
                  plain = json.delta
                } else if (Array.isArray(json?.choices) && json.choices.length > 0) {
                  const ch = json.choices[0]
                  plain = ch?.delta?.content || ch?.text || ch?.message?.content || ""
                }
                if (plain) appendChunk(assistantIndex, plain)
              } catch (_e) {
                // ignore malformed chunks
              }
            }
            return undefined
          }

          let finished = false

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            // Process complete SSE events separated by blank lines
            let idx
            // Loop to handle multiple events per chunk
            while ((idx = buffer.indexOf("\n\n")) !== -1) {
              const block = buffer.slice(0, idx)
              buffer = buffer.slice(idx + 2)
              const status = flushEvents(block)
              if (status === "DONE") {
                // Drain remaining
                buffer = ""
                finished = true
                break
              }
            }
            if (finished) break
          }

          // Flush any remaining decoded bytes (in case the final chunk wasn't newline-terminated)
          const tail = decoder.decode()
          if (tail) {
            buffer += tail
            if (buffer) void flushEvents(buffer)
          }
          // Finalize receipt from headers and observed model
          setLastRun({
            price: undefined,
            currency: "UNREAL",
            txHash: costTxHash || priceTxHash || undefined,
            requestId: requestIdHeader,
            headers: headersObj,
            usage: undefined,
            model: modelSeen || model,
            timestamp: Date.now(),
            headerCosts: {
              input: headerInputCost,
              output: headerOutputCost,
              total: headerTotalCost,
            },
            priceTx: { hash: priceTxHash, url: priceTxUrl },
            costTx: { hash: costTxHash, url: costTxUrl },
            refund: {
              amount: refundAmount,
              tx: { hash: refundTxHash, url: refundTxUrl },
            },
            paymentTokenUrl,
            chain: { id: chainIdParsed, name: chainName },
            callsRemaining,
          })

          setIsStreaming(false)
          return
        } catch (e) {
          const err = e as { name?: string; message?: string }
          const name = err?.name ?? ""
          const msgText = err?.message ?? (e instanceof Error ? e.message : String(e ?? ""))
          if (
            name === "AbortError" ||
            /abort(ed)?/i.test(msgText)
          ) {
            // User-initiated stop
            setIsStreaming(false)
            return
          }
          console.error("Streaming error:", e)
          // If no chunks arrived, remove the placeholder assistant message
          if (!hasStreamed) {
            setMessages((prev) => {
              const next = [...prev]
              const last = next[next.length - 1] as UIMessage | undefined
              const isEmptyAssistant =
                last && last.role === "assistant" &&
                !getTextFromMessage(last as UIMessage)
              if (isEmptyAssistant) next.pop()
              return next
            })
          }
          setError(msgText || "Streaming failed. Please try again.")
          setIsStreaming(false)
          return
        }
      }

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
        let completion: unknown | null = null
        let headersCollected: Record<string, string> | null = null
        let requestId: string | null = null
        let parsedTxHash: string | undefined = undefined
        let parsedPrice: string | undefined
        let parsedCurrency: string | undefined = undefined
        let activeChainId: number | null = null

        // Header-derived metadata (declared in outer scope for later use)
        let headerInputCost: number | undefined
        let headerOutputCost: number | undefined
        let headerTotalCost: number | undefined
        let priceTxHash: string | undefined
        let priceTxUrl: string | undefined
        let costTxHash: string | undefined
        let costTxUrl: string | undefined
        let refundAmount: number | undefined
        let refundTxHash: string | undefined
        let refundTxUrl: string | undefined
        let paymentTokenUrl: string | undefined
        let chainName: string | undefined
        let chainIdParsed: number | undefined
        let callsRemaining: number | undefined

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

            // Use non-streamed responses API
            const systemMessage = openaiMessages.find(m => m.role === "system")
            const userMessages = openaiMessages.filter(m => m.role !== "system")
            const result = await client.responses
              .create(
                {
                  model,
                  instructions: systemMessage?.content || "You are a helpful assistant.",
                  input: userMessages.map(m => `${m.role}: ${m.content}`).join("\n"),
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

            // Parse explicit headers for price/cost and transactions
            const h = headersObj

            if (!h) {
              return
            }

            const num = (s?: string) => {
              if (s == null) return undefined
              const n = Number(s)
              return Number.isFinite(n) ? n : undefined
            }
            headerInputCost = num(h["openai-input-cost"]) // UNREAL
            headerOutputCost = num(h["openai-output-cost"]) // UNREAL
            headerTotalCost = num(h["openai-total-cost"]) // UNREAL
            priceTxHash = h["openai-price-tx"]
            priceTxUrl = h["openai-price-tx-url"]
            costTxHash = h["openai-cost-tx"]
            costTxUrl = h["openai-cost-tx-url"]
            refundAmount = num(h["openai-refund-amount"]) // UNREAL
            refundTxHash = h["openai-refund-tx"]
            refundTxUrl = h["openai-refund-tx-url"]
            paymentTokenUrl = h["openai-payment-token"]
            callsRemaining = num(h["openai-calls-remaining"]) ?? undefined
            chainName = h["openai-chain"]
            const chainIdHeader = h["openai-chain-id"]
            chainIdParsed = chainIdHeader
              ? Number.isFinite(Number(chainIdHeader))
                ? Number(chainIdHeader)
                : undefined
              : undefined

            // Use costTx hash as primary txHash if present
            parsedTxHash = costTxHash || priceTxHash || undefined
            // Do not set parsedPrice from arbitrary headers; rely on headerTotalCost/computed costs
            parsedPrice = h["openai-price"]
            parsedCurrency = "UNREAL"

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

        const outputTextFinal = extractOutputText(completion)
        if (outputTextFinal) {
          const newMessage: UIMessage = {
            id: makeId(),
            role: "assistant",
            parts: [{ type: "text", text: outputTextFinal }],
          }
          setMessages((prev) => [...prev, newMessage])

          setLastRun({
            price: parsedPrice ? Number(parsedPrice) : undefined,
            currency: parsedCurrency || "UNREAL",
            txHash: parsedTxHash,
            requestId,
            headers: headersCollected || undefined,
            usage: (completion as { usage?: unknown }).usage as
              | {
                  prompt_tokens?: number
                  completion_tokens?: number
                  total_tokens?: number
                }
              | undefined,
            model: (completion as { model?: string }).model,
            timestamp: Date.now(),
            headerCosts: {
              input: headerInputCost,
              output: headerOutputCost,
              total: headerTotalCost,
            },
            priceTx: { hash: priceTxHash, url: priceTxUrl },
            costTx: { hash: costTxHash, url: costTxUrl },
            refund: {
              amount: refundAmount,
              tx: { hash: refundTxHash, url: refundTxUrl },
            },
            paymentTokenUrl,
            chain: { id: chainIdParsed, name: chainName },
            callsRemaining,
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
    [
      apiKey,
      token,
      model,
      getTextFromMessage,
      getCurrentChainId,
      enableStreaming,
      extractOutputText,
    ]
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
              <span className="mr-2">
                In {fmtNum(per1k(selectedPricing.input_unreal))} UNREAL/1K
              </span>
              <span>
                Out {fmtNum(per1k(selectedPricing.output_unreal))} UNREAL/1K
              </span>
            </div>
          )}
          {!selectedPricing && pricingError && (
            <div className="text-xs md:text-sm text-muted-foreground">
              Pricing unavailable
            </div>
          )}
          {/* Pricing Catalog popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-1">
                <List className="w-4 h-4 mr-1" /> Catalog
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-3" align="start">
              <div className="text-sm font-medium mb-2">
                Pricing Catalog (UNREAL)
              </div>
              {isLoadingPricing && (
                <div className="text-xs text-muted-foreground">
                  Loading pricing…
                </div>
              )}
              {!isLoadingPricing && Object.keys(pricing).length === 0 && (
                <div className="text-xs text-muted-foreground">
                  No pricing available
                </div>
              )}
              {!isLoadingPricing && Object.keys(pricing).length > 0 && (
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-background">
                      <tr className="text-left">
                        <th className="py-1 pr-2">Model</th>
                        <th className="py-1 pr-2">In/1K</th>
                        <th className="py-1">Out/1K</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(pricing)
                        .sort((a, b) => a.model.localeCompare(b.model))
                        .map((p) => (
                          <tr key={p.model} className="border-t">
                            <td className="py-1 pr-2 font-mono">{p.model}</td>
                            <td className="py-1 pr-2">
                              {fmtNum(per1k(p.input_unreal))}
                            </td>
                            <td className="py-1">
                              {fmtNum(per1k(p.output_unreal))}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PopoverContent>
          </Popover>
          {/* Streaming toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 ml-2 select-none">
                <span className="hidden md:inline text-xs text-muted-foreground">
                  Stream (beta)
                </span>
                <Switch
                  checked={enableStreaming}
                  onCheckedChange={(c) => setEnableStreaming(Boolean(c))}
                  aria-label="Toggle streaming"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Stream tokens live via SSE. Receipts still use response headers.
            </TooltipContent>
          </Tooltip>
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
            {(typeof lastRun.callsRemaining === "number" ||
              typeof verifyData?.remaining === "number") && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">
                  {Number(
                    (typeof lastRun.callsRemaining === "number"
                      ? lastRun.callsRemaining
                      : verifyData?.remaining) as number
                  ).toLocaleString()}
                </span>
              </div>
            )}
            {lastRun.usage && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Usage</span>
                <span className="font-medium">
                  {lastRun.usage.prompt_tokens ?? 0} in ·{" "}
                  {lastRun.usage.completion_tokens ?? 0} out ·{" "}
                  {lastRun.usage.total_tokens ??
                    (lastRun.usage.prompt_tokens ?? 0) +
                      (lastRun.usage.completion_tokens ?? 0)}{" "}
                  total
                </span>
              </div>
            )}
            {/* Price popover removed per request; use Receipt modal instead */}
            {/* Receipt action - open modal */}
            {lastRun && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReceiptOpen(true)}
                  >
                    Receipt
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open the latest receipt</TooltipContent>
              </Tooltip>
            )}
            {lastRun.requestId && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">ReqID</span>
                <button
                  type="button"
                  onClick={() =>
                    void copyToClipboard(lastRun.requestId || undefined)
                  }
                  className="font-mono underline-offset-2 hover:underline"
                  title="Copy request id"
                >
                  {short(lastRun.requestId)}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void copyToClipboard(lastRun.requestId || undefined)
                  }
                  className="p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Copy request id"
                  title="Copy request id"
                >
                  <CopyIcon className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails((s) => !s)}
              >
                {showDetails ? "Hide details" : "Show details"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportJson}
                title="Export JSON"
              >
                <FileJson className="w-4 h-4 mr-1" /> JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportCsv}
                title="Export CSV"
              >
                <FileDown className="w-4 h-4 mr-1" /> CSV
              </Button>
            </div>
          </div>
          {showDetails && (
            <div className="mt-2 rounded border bg-background/50 p-3 max-h-64 overflow-auto">
              <div className="text-muted-foreground mb-1">Raw headers</div>
              <div className="max-h-48 overflow-auto rounded bg-muted/50 p-2">
                <pre className="text-[11px] leading-tight">
                  {JSON.stringify(lastRun.headers ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>Details for the last run</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Model</div>
              <div className="font-mono">{fmtOrDash(lastRun?.model)}</div>
              <div className="text-muted-foreground">Request ID</div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono truncate"
                  title={fmtOrDash(lastRun?.requestId)}
                >
                  {fmtOrDash(lastRun?.requestId)}
                </span>
                {lastRun?.requestId && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      void copyToClipboard(lastRun?.requestId || undefined)
                    }
                    title="Copy request id"
                  >
                    <CopyIcon className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Initial Price</div>
              <div className="flex items-center gap-1">
                {fmtOrDash(
                  typeof lastRun?.price === "number"
                    ? `${fmtNum(lastRun?.price)} UNREAL`
                    : undefined
                )}
                {lastRun?.priceTx?.hash && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">-</span>
                    <ExpandableHash 
                      hash={lastRun.priceTx.hash} 
                      url={lastRun.priceTx.url}
                      type="price"
                    />
                  </div>
                )}
              </div>
              <div className="text-muted-foreground">Total Cost</div>
              <div className="flex items-center gap-1">
                {fmtOrDash(
                  typeof dispTotalCost === "number"
                    ? `${fmtNum(dispTotalCost)} UNREAL`
                    : undefined
                )}
                {lastRun?.costTx?.hash && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">-</span>
                    <ExpandableHash 
                      hash={lastRun.costTx.hash} 
                      url={lastRun.costTx.url}
                      type="cost"
                    />
                  </div>
                )}
              </div>
              <div className="text-muted-foreground pl-4">Input</div>
              <div>
                {fmtOrDash(
                  typeof dispInCost === "number"
                    ? `${fmtNum(dispInCost)} UNREAL`
                    : undefined
                )}
              </div>
              <div className="text-muted-foreground pl-4">Output</div>
              <div>
                {fmtOrDash(
                  typeof dispOutCost === "number"
                    ? `${fmtNum(dispOutCost)} UNREAL`
                    : undefined
                )}
              </div>

              {typeof lastRun?.refund?.amount === "number" && (
                <>
                  <div className="text-muted-foreground">Refund</div>
                  <div className="flex items-center gap-1">
                    <span>{fmtNum(lastRun.refund.amount)} UNREAL</span>
                    {lastRun.refund.tx?.hash && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">-</span>
                        <ExpandableHash 
                          hash={lastRun.refund.tx.hash} 
                          url={lastRun.refund.tx.url}
                          type="refund"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="text-muted-foreground mb-1">Usage</div>
              <div className="text-xs">
                {fmtOrDash(lastRun?.usage?.prompt_tokens)} in ·{" "}
                {fmtOrDash(lastRun?.usage?.completion_tokens)} out ·{" "}
                {fmtOrDash(
                  lastRun?.usage?.total_tokens ??
                    (lastRun?.usage?.prompt_tokens ?? 0) +
                      (lastRun?.usage?.completion_tokens ?? 0)
                )}{" "}
                total
              </div>
            </div>

            <div>
              <div className="text-muted-foreground mb-1">Raw headers</div>
              <div className="max-h-64 overflow-auto rounded bg-background/50 p-2">
                <pre className="text-[11px] leading-tight">
                  {JSON.stringify(lastRun?.headers ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={exportJson}>
                <FileJson className="w-4 h-4 mr-1" /> JSON
              </Button>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <FileDown className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setReceiptOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        {/* Predictive estimate for input/output and total cost */}
        {selectedPricing && input.trim().length > 0 && (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <div>
                Est. input tokens:{" "}
                <span className="font-medium">
                  {estInputTokens.toLocaleString()}
                </span>
              </div>
              <div>
                Est. input cost:{" "}
                <span className="font-medium">
                  {fmtNum(estInputCost)} UNREAL
                  {hasFiat && typeof estInputFiat === "number"
                    ? ` · ${fmtNum(estInputFiat)} ${fiatCode}`
                    : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                Output guess:
                <Select
                  value={String(outputGuess)}
                  onValueChange={(v) => setOutputGuess(Number(v))}
                >
                  <SelectTrigger className="h-7 w-[140px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">Short (100)</SelectItem>
                    <SelectItem value="300">Medium (300)</SelectItem>
                    <SelectItem value="800">Long (800)</SelectItem>
                    <SelectItem value="1500">Very long (1500)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                Est. output cost:{" "}
                <span className="font-medium">
                  {fmtNum(estOutputCost)} UNREAL
                  {hasFiat && typeof estOutputFiat === "number"
                    ? ` · ${fmtNum(estOutputFiat)} ${fiatCode}`
                    : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end">
              Est. total cost:{" "}
              <span className="ml-1 font-medium">
                {fmtNum(estTotalCost)} UNREAL
                {hasFiat && typeof estTotalFiat === "number"
                  ? ` · ${fmtNum(estTotalFiat)} ${fiatCode}`
                  : ""}
              </span>
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
