import React, { useCallback, useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Play, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useApi } from "@/lib/ApiContext"
import { CODING_MODEL } from "@/config/models"
import { OPENAI_URL } from "@/config/unreal"
import OpenAI from "openai"
import { useNavigate } from "react-router"

interface OpenAIStreamingPlaygroundProps {
  initialPrompt?: string
  autorun?: boolean
}

const OpenAIStreamingPlayground: React.FC<OpenAIStreamingPlaygroundProps> = ({ initialPrompt, autorun }) => {
  const { apiKey, isAuthenticated } = useApi()
  const navigate = useNavigate()

  const [isRunning, setIsRunning] = useState(false)
  const [response, setResponse] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Auto-scroll live response
  const responseContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = responseContainerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [response])

  const handleRun = useCallback(async () => {
    setError(null)
    setResponse("")

    if (!isAuthenticated) {
      setError("You need to connect your wallet first to run this demo.")
      return
    }

    // Require an explicit API key; guide to Settings if missing
    const effectiveKey = apiKey
    if (!effectiveKey) {
      setError("API key required. Please create one in Settings to run the demo.")
      return
    }

    setIsRunning(true)
    try {
      // Create OpenAI client with custom base URL
      const client = new OpenAI({
        apiKey: effectiveKey,
        baseURL: OPENAI_URL,
        // We intentionally allow browser usage here because the user provides their own key
        dangerouslyAllowBrowser: true,
        fetch: (input, init) =>
          fetch(input as RequestInfo, {
            ...(init || {}),
            credentials: "include",
          }),
      })

      console.log("Starting stream with OpenAI SDK...")
      
      // Prepare prompt
      const userPrompt = (initialPrompt && initialPrompt.trim().length > 0)
        ? initialPrompt
        : "Write a concise TypeScript function called `toTitleCase` that converts a string to Title Case, followed by a short usage example."

      // Start a streaming response using Responses API
      const stream = await client.responses.create({
        model: CODING_MODEL,
        instructions: "You are a helpful coding assistant.",
        input: userPrompt,
        stream: true,
      })

      console.log("Stream created, reading chunks...")

      // Read incremental deltas and append to response
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          setResponse((prev) => prev + event.delta)
        }
      }

      console.log("Stream completed")
    } catch (error) {
      console.error("Streaming error:", error)
      const errorMessage = error instanceof Error ? error.message : "Request failed. Please try again."
      setError(errorMessage)
    } finally {
      setIsRunning(false)
    }
  }, [apiKey, isAuthenticated, initialPrompt])

  // Optional autorun for guided experiences
  useEffect(() => {
    if (autorun) {
      // debounce slightly to allow layout to mount
      const t = setTimeout(() => {
        handleRun()
      }, 100)
      return () => clearTimeout(t)
    }
  }, [autorun, handleRun])

  return (
    <div className="w-full">
      {error && (
        <Alert className="mb-6 border-red-500 bg-red-500/15">
          <AlertDescription>
            <div className="flex items-center justify-between gap-3">
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
                  onClick={handleRun}
                  disabled={isRunning}
                >
                  Retry
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-0">
          <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">Live Response</span>
              {initialPrompt && (
                <div className="hidden md:block pl-3 border-l border-slate-700 ml-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-slate-400 truncate max-w-[360px] block">
                        Prompt: {initialPrompt}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <span className="text-xs break-words">Prompt: {initialPrompt}</span>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {CODING_MODEL}
              </Badge>
              <Button
                size="sm"
                onClick={handleRun}
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700"
              >
                {isRunning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run
                  </>
                )}
              </Button>
            </div>
          </div>
          <div
            ref={responseContainerRef}
            className="p-6 bg-slate-950 min-h-[300px] max-h-[60vh] overflow-y-auto"
          >
            {response ? (
              <motion.pre
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-blue-400 overflow-x-auto whitespace-pre-wrap"
              >
                <code>{response}</code>
              </motion.pre>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Run" to stream the code</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OpenAIStreamingPlayground
