
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Copy, Check, Terminal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CodePlayground = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);

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
console.log(data.choices[0].message.content);`;

  const mockResponse = `{
  "id": "chatcmpl-7X8Y9Z0A1B2C3D4E5F",
  "object": "chat.completion",
  "created": 1735747200,
  "model": "unreal::mixtral-8x22b-instruct",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Quantum computing uses the strange properties of quantum mechanics to process information in ways that classical computers cannot. Think of it like this: while regular computers use bits that are either 0 or 1, quantum computers use 'qubits' that can be both 0 and 1 simultaneously - like a spinning coin that's both heads and tails until it lands."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 67,
    "total_tokens": 79
  },
  "billing": {
    "cost_unreal_tokens": 1,
    "transaction_hash": "0xabc123..."
  }
}`;

  const handleRunCode = () => {
    setIsRunning(true);
    setResponse('');
    
    // Simulate API call with streaming effect
    setTimeout(() => {
      const words = mockResponse.split(' ');
      let currentIndex = 0;
      
      const streamInterval = setInterval(() => {
        if (currentIndex < words.length) {
          setResponse(prev => prev + (currentIndex === 0 ? '' : ' ') + words[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(streamInterval);
          setIsRunning(false);
        }
      }, 50);
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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
                    <span className="text-sm text-slate-300">Live Response</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-blue-600 text-white">
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
                  <p className="text-sm text-slate-400">Token-by-token responses</p>
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
                  <p className="text-sm text-slate-400">Transparent transactions</p>
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
  );
};

export default CodePlayground;
