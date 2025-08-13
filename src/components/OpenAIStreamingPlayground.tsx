import React, { useCallback, useMemo, useState } from "react"
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

const OpenAIStreamingPlayground: React.FC = () => {
  const { apiKey, token: sessionToken, isAuthenticated } = useApi()

  const [prompt, setPrompt] = useState<string>(
    "Write a concise TypeScript function called `toTitleCase` that converts a string to Title Case, followed by a short usage example."
  )
  const [isRunning, setIsRunning] = useState(false)
  const [response, setResponse] = useState("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const codeSnippet = useMemo(
    () => `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your-api-key-here',
  baseURL: '${OPENAI_URL}',
  // Only for browser demos. Do NOT use this in production.
  dangerouslyAllowBrowser: true,
});

const stream = await client.chat.completions.create({
  model: '${CODING_MODEL}',
  stream: true,
  messages: [
    { role: 'system', content: 'You are a helpful coding assistant.' },
    { role: 'user', content: '${prompt.replace(/`/g, "\\`")}' },
  ],
});

for await (const chunk of stream) {
  const delta = chunk.choices?.[0]?.delta?.content || '';
  // append delta to your UI
  console.log(delta);
}`,
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

    // Use explicit API key if provided, else fall back to session token (register key)
    const effectiveKey = apiKey || sessionToken
    if (!effectiveKey) {
      setError(
        "No API key or session token found. Please generate one or register first."
      )
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
  }, [apiKey, sessionToken, isAuthenticated, prompt])

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-2">
            Try It Live: OpenAI SDK Streaming
          </h2>
          <p className="text-xl text-slate-300">
            Uses the official OpenAI-compatible SDK to stream tokens in real
            time
          </p>
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
                    <span className="text-sm text-slate-300">OpenAI SDK</span>
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
                    <div className="text-sm text-slate-400 mb-2">
                      JavaScript (OpenAI SDK)
                    </div>
                    <pre className="text-xs md:text-sm text-green-400 overflow-x-auto">
                      <code>{codeSnippet}</code>
                    </pre>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Package className="w-3.5 h-3.5" />
                    Install SDK:{" "}
                    <code className="text-slate-300">npm i openai</code>
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

                <div className="p-6 bg-slate-950 min-h-[300px]">
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
