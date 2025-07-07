import React, { useState } from "react"
import { motion } from "framer-motion"
import { Play, Copy, Check, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const CodePlayground = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [response, setResponse] = useState("")
  const [copied, setCopied] = useState(false)

  const sampleCode = `const response = await fetch('https://openai.unreal.art/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key-here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'unreal::mixtral-8x22b-instruct',
    messages: [{
      role: 'user', 
      content: 'Explain quantum computing in simple terms'
    }]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`

  const mockResponse = {
    id: "43d7a268-e40e-4e07-967c-91f4392531b4",
    choices: [
      {
        finish_reason: "length",
        index: 0,
        logprobs: null,
        message: {
          content:
            "Okay, so I need to explain quantum computing in simple terms. Let me start by recalling what I know. Regular computers use bits, which are 0s and 1s. Quantum computers use qubits, right? Qubits can be both 0 and 1 at the same time because of superposition. But how exactly does that work?\n\nWait, quantum mechanics is involved here. Maybe I should start by comparing classical bits to qubits. Bits are like switches, either on or off. Qubits can be in a state that's a combination of both. So the key points are superposition and maybe entanglement. Oh, right, entanglement is another quantum phenomenon where qubits can be linked, so the state of one affects the other instantly, no matter the distance. That probably helps in processing information faster.\n\nBut how to explain superposition simply? Maybe like a spinning coin that's both heads and tails until it lands. So until you measure a qubit, it's in multiple states. Then when you measure, it collapses to one state. So quantum computers can process many possibilities at once. But aren't they probabilistic rather than deterministic? So the answer might be a probability distribution, which means we have to run the computation multiple times to get the most probable result.\n\nThen there's entanglement. If qubits are entangled, measuring one tells you the state of the other immediately. How does that help in computing? Maybe for linking qubits in a way that allows for more complex operations. It can allow for more efficient algorithms, like Shor's algorithm for factoring large numbers, which is hard for classical computers. That's why quantum computers could break encryption, but I don't need to get into that here.\n\nAlso, quantum gates. Classical computers use logic gates (AND, OR, NOT) to manipulate bits. Quantum computers use quantum gates that manipulate qubits through rotation and entanglement. These gates must be reversible, unlike some classical gates. So the operations preserve the quantum state until measurement.\n\nApplications? Quantum computing can solve certain problems faster, like optimization, drug discovery by simulating molecules, or machine learning. But they’re not better at everything, just specific tasks where quantum properties give an advantage.\n\nPotential pitfalls: Decoherence. Qubits are fragile, and interactions with the environment can cause errors. So error correction is a big challenge. Also, they require extreme cooling to maintain quantum states.\n\nSo putting it all together in a simple explanation. Maybe start by comparing bits vs qubits, mention superposition and entanglement as key concepts, explain how that allows processing many possibilities at once, and some real-world applications. Avoid jargon as much as possible. Use analogies like the spinning coin for superposition and maybe a team of entangled qubits working together. Finish with why it's exciting but still developing.\n\nWait, but the user asked to explain quantum computing, not the challenges. So focus on the basics: how qubits work with superposition and entanglement, allowing for parallel processing, leading to faster solutions for specific problems. Maybe mention that it's different from classical computing and gives examples where it's useful. Keep it simple, avoid technical terms unless necessary. Use everyday analogies.\n\nMake sure to check if there are any misconceptions. For example, people sometimes think quantum computers can solve any problem faster, which isn't true. It's important to note they're good for specific problems, like factoring, searching unsorted databases (Grover's algorithm), or simulating quantum systems.\n\nLet me structure the answer:\n\n1. Start with the difference between bits and qubits.\n2. Introduce superposition and entanglement with analogies.\n3. Explain how quantum algorithms use these properties to perform tasks faster.\n4. Mention some applications.\n5. Note that they are still in development and not replacing classical computers.\n\nAvoid math and complex terms. Keep each concept straightforward. Maybe use the analogy of a quantum computer exploring many paths at once versus a classical computer taking one path at a time.\n</think>\n\n**Quantum Computing Explained Simply**\n\nImagine you're in a maze with many paths. A classical computer tries each path one by one to find the exit. A **quantum computer**, however, can explore all paths *at the same time*. Here's how it works:\n\n1. **Qubits vs. Bits**  \n   - Classical computers use **bits** (0 or 1, like a light switch).  \n   - Quantum computers use **qubits**, which can be 0, 1, or *both at once* thanks to **superposition**—like a spinning coin that’s both heads and tails until it lands.\n\n2. **Entanglement**  \n   Qubits can be **entangled**, meaning their states are linked. If one qubit’s state changes, the other instantly adjusts, no matter how far apart they are. Think of it like magic dice: roll one, and the other instantly shows a matching number.\n\n3. **Quantum Speed**  \n   By leveraging superposition and entanglement, quantum computers process vast combinations of possibilities *simultaneously*. This allows them to",
          refusal: null,
          role: "assistant",
          annotations: null,
          audio: null,
          function_call: null,
          tool_calls: null,
        },
      },
    ],
    created: 1751859469,
    model: "accounts/perplexity/models/r1-1776",
    object: "chat.completion",
    service_tier: null,
    system_fingerprint: null,
    usage: {
      completion_tokens: 1024,
      prompt_tokens: 11,
      total_tokens: 1035,
      completion_tokens_details: null,
      prompt_tokens_details: null,
    },
  }

  // Extract the assistant message content to stream instead of full JSON
  const mockContent =
    (mockResponse.choices && mockResponse.choices[0]?.message?.content) || ""

  const handleRunCode = () => {
    setIsRunning(true)
    setResponse("")

    // Simulate API call with streaming effect
    setTimeout(() => {
      const words = mockContent.split(" ")
      let currentIndex = 0

      const streamInterval = setInterval(() => {
        if (currentIndex < words.length) {
          setResponse(
            (prev) =>
              prev + (currentIndex === 0 ? "" : " ") + words[currentIndex]
          )
          currentIndex++
        } else {
          clearInterval(streamInterval)
          setIsRunning(false)
        }
      }, 50)
    }, 500)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-6">Try It Live</h2>
          <p className="text-xl text-slate-300 mb-8">
            Test our API with your key and see real-time responses
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Code Editor */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-0">
                <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">API Test</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(sampleCode)}
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
                      onClick={handleRunCode}
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

                <div className="p-6 bg-slate-950">
                  <pre className="text-sm text-green-400 overflow-x-auto">
                    <code>{sampleCode}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Response Panel */}
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
                      1 $UNREAL
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-700">
                      79 tokens
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
                        <p>Click "Run" to see the API response</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 grid md:grid-cols-3 gap-4"
          >
            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  ⚡
                </div>
                <div>
                  <h4 className="font-semibold">Real-time Streaming</h4>
                  <p className="text-sm text-slate-400">
                    Token-by-token responses
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  🔗
                </div>
                <div>
                  <h4 className="font-semibold">On-chain Billing</h4>
                  <p className="text-sm text-slate-400">
                    Transparent transactions
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  📊
                </div>
                <div>
                  <h4 className="font-semibold">Usage Analytics</h4>
                  <p className="text-sm text-slate-400">Detailed metrics</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default CodePlayground
