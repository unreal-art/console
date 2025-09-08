import React, { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useApi } from "@/lib/ApiContext"
import { OPENAI_URL } from "@/config/unreal"
import { DEFAULT_MODEL } from "@/config/models"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { AlertCircle, Loader2, Send, Trash2 } from "lucide-react"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

interface LiveChatPlaygroundProps {
  initialPrompt?: string
  autorun?: boolean
}

interface SimpleMessage {
  role: "user" | "assistant" | "system"
  content: string
}

const LiveChatPlayground: React.FC<LiveChatPlaygroundProps> = ({
  initialPrompt,
  autorun,
}) => {
  const { apiKey, token, isAuthenticated } = useApi()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<SimpleMessage[]>([])
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const clearConversation = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim()
      if (!content) return

      if (!isAuthenticated && !apiKey && !token) {
        setError("You need to sign in or provide an API key in Settings.")
        return
      }

      setError(null)

      // Compose user + placeholder assistant message
      const userMsg: SimpleMessage = { role: "user", content }
      const history = [...messages, userMsg]
      const assistantIndex = history.length
      setMessages([...history, { role: "assistant", content: "" }])
      setInput("")
      setIsStreaming(true)

      try {
        const auth = apiKey || token || undefined
        const openai = createOpenAI({
          apiKey: auth,
          baseURL: OPENAI_URL,
          fetch: (input, init) =>
            fetch(input as RequestInfo, {
              ...(init || {}),
              credentials: "include",
              headers: {
                ...init?.headers,
                // Accept: "text/event-stream",
              },
            }),
        })

        const { textStream } = await streamText({
          model: openai(DEFAULT_MODEL),
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          onChunk: (chunk) => {
            console.log({ chunk })
            // Append chunk to the assistant placeholder message
            setMessages((prev) => {
              const next = [...prev]
              const current = next[assistantIndex]
              if (current && current.role === "assistant") {
                next[assistantIndex] = {
                  ...current,
                  content: current.content + chunk,
                }
              }
              return next
            })
          },
        })

        // console.log("textStream", textStream)

        for await (const chunk of textStream) {
          console.log({ chunk })
          // Append chunk to the assistant placeholder message
          setMessages((prev) => {
            const next = [...prev]
            const current = next[assistantIndex]
            if (current && current.role === "assistant") {
              next[assistantIndex] = {
                ...current,
                content: current.content + chunk,
              }
            }
            return next
          })
        }
      } catch (err) {
        console.error("Streaming error:", err)
        const msg =
          err instanceof Error
            ? err.message
            : "Request failed. Please try again."
        setError(msg)
      } finally {
        setIsStreaming(false)
      }
    },
    [apiKey, token, messages, input, isAuthenticated]
  )

  // Optional autorun for guided experiences
  useEffect(() => {
    if (autorun && initialPrompt) {
      const t = setTimeout(() => {
        void sendMessage(initialPrompt)
      }, 120)
      return () => clearTimeout(t)
    }
  }, [autorun, initialPrompt, sendMessage])

  return (
    <div className="w-full">
      {error && (
        <Alert className="mb-4 border-red-500 bg-red-500/15">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-3">
            <span className="truncate">{error}</span>
            <div className="flex items-center gap-2">
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

      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">
          Streaming with AI SDK
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                disabled={isStreaming}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear conversation</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="space-y-3 mb-4 h-[60vh] md:h-[70vh] overflow-y-auto p-2"
      >
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-10">
            Send a message to start streaming
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
            <p className="whitespace-pre-wrap break-words">{m.content}</p>
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
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault()
              void sendMessage()
            }
          }}
        />
        <div className="flex items-center justify-end">
          <Button
            onClick={() => void sendMessage()}
            disabled={isStreaming || !input.trim()}
            title="Send (Cmd/Ctrl+Enter)"
          >
            {isStreaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Streaming...
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

export default LiveChatPlayground
