import React, { useCallback, useMemo, useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Play, Copy, Check, Terminal, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/lib/ApiContext"
import { CODING_MODEL } from "@/config/models"
import { OPENAI_URL } from "@/config/unreal"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { useNavigate } from "react-router-dom"

const OpenAIStreamingPlayground: React.FC = () => {
  const { apiKey, isAuthenticated } = useApi()
  const navigate = useNavigate()

  const [prompt, setPrompt] = useState<string>(
    "Write a concise TypeScript function called `toTitleCase` that converts a string to Title Case, followed by a short usage example."
  )
  const [isRunning, setIsRunning] = useState(false)
  const [response, setResponse] = useState("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-scroll live response
  const responseContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = responseContainerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [response])

  const codeSnippet = useMemo(
    () => `const response = await fetch('${OPENAI_URL}/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key-here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: '${CODING_MODEL}',
    messages: [{
      role: 'user',
      content: '${prompt.replace(/`/g, "\\`")}'
    }]
  })
});
const data = await response.json();
console.log(data.choices[0].message.content);`,
    [prompt]
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRun = useCallback(async () => {
    setError(null)
    setResponse("")

    if (!isAuthenticated) {
      setError("You need to connect your wallet first to run this demo.")
      return
    }

    // Require an explicit API key; redirect to Settings if missing
    const effectiveKey = apiKey
    if (!effectiveKey) {
      setError("You need to generate an API key first. Redirecting to Settings...")
      navigate("/settings")
      return
    }

    setIsRunning(true)
    try {
      // Create OpenAI provider with custom base URL
      const openai = createOpenAI({
        apiKey: effectiveKey,
        baseURL: OPENAI_URL,
      })

      console.log("Starting stream with AI SDK...")
      
      // Stream text using the AI SDK
      const { textStream } = await streamText({
        model: openai(CODING_MODEL),
        messages: [
          { role: "system", content: "You are a helpful coding assistant." },
          { role: "user", content: prompt },
        ],
      })

      console.log("Stream created, reading chunks...")
      
      // Read from the stream
      for await (const chunk of textStream) {
        console.log("Chunk received:", chunk)
        setResponse((prev) => prev + chunk)
      }
      
      console.log("Stream completed")
    } catch (error) {
      console.error("Streaming error:", error)
      const errorMessage = error instanceof Error ? error.message : "Request failed. Please try again."
      setError(errorMessage)
    } finally {
      setIsRunning(false)
    }
  }, [apiKey, isAuthenticated, prompt, navigate])

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-2">Try It Live: API Test</h2>
          <p className="text-xl text-slate-300">Test our API with your key and see real-time responses</p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {error && (
            <Alert className="mb-6 border-red-500 bg-red-500/15">
              <AlertDescription>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{error}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRun}
                    disabled={isRunning}
                  >
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Editor */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-0">
                <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">API Test (Fetch)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(codeSnippet)}
                      className="text-slate-400 hover:text-white"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
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
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
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

                <div className="p-6 bg-slate-950 space-y-4">
                  <div>
                    <div className="text-sm text-slate-400 mb-2">Prompt</div>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Describe the code you want the model to write..."
                      disabled={isRunning}
                    />
                  </div>

                  <div>
                    <div className="text-sm text-slate-400 mb-2">JavaScript (Fetch)</div>
                    <pre className="text-xs md:text-sm text-green-400 overflow-x-auto">
                      <code>{codeSnippet}</code>
                    </pre>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Package className="w-3.5 h-3.5" />
                    Endpoint: {" "}
                    <code className="text-slate-300">{OPENAI_URL}/chat/completions</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Response */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-0">
                <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-slate-300">
                      Live Response
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-600 text-white"
                    >
                      {CODING_MODEL}
                    </Badge>
                  </div>
                </div>

                <div ref={responseContainerRef} className="p-6 bg-slate-950 min-h-[300px] max-h-[60vh] overflow-y-auto">
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
                        <p>Enter a prompt and click "Run" to stream the code</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OpenAIStreamingPlayground
