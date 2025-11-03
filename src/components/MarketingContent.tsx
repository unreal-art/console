import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FeatureCards from "@/components/FeatureCards"
import TestimonialCarousel from "@/components/TestimonialCarousel"
import FAQ from "@/components/FAQ"
import { Check, Copy } from "lucide-react"

const MarketingContent: React.FC = () => {
  const [copied, setCopied] = useState(false)

  const codeExamples = {
    curl: `curl -X POST "https://openai.ideomind.org/v1/chat/completions" \\\n  -H "Authorization: Bearer your-api-key-here" \\\n  -H "Content-Type: application/json" \\\n  -d '{
    "model": "mixtral-8x22b-instruct",
    "messages": [{"role": "user", "content": "Hello world!"}]
  }'`,
    python: `import openai

client = openai.OpenAI(
    api_key="your-api-key-here",
    base_url="https://openai.ideomind.org/v1"
)

response = client.chat.completions.create(
    model="mixtral-8x22b-instruct",
    messages=[{"role": "user", "content": "Hello world!"}]
)

print(response.choices[0].message.content)`,
    javascript: `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your-api-key-here',
  baseURL: 'https://openai.ideomind.org/v1'
});

const response = await client.chat.completions.create({
  model: 'mixtral-8x22b-instruct',
  messages: [{ role: 'user', content: 'Hello world!' }]
});

console.log(response.choices[0].message.content);`,
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Code Examples Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-6">Works with Your Favorite SDKs</h2>
            <p className="text-xl text-slate-300 mb-8">
              Drop-in replacement for OpenAI API. Zero code changes required.
            </p>
          </motion.div>

          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-0">
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>

                {Object.entries(codeExamples).map(([key, code]) => (
                  <TabsContent key={key} value={key} className="relative">
                    <div className="bg-slate-950 p-6 rounded-b-lg">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-400 text-sm">
                          Works out of the box with your favorite OpenAI SDKs
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(code)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                      <pre className="text-sm text-green-400 overflow-x-auto">
                        <code>{code}</code>
                      </pre>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Cards */}
      <FeatureCards />



      {/* Testimonials */}
      <TestimonialCarousel />

      {/* FAQ */}
      <FAQ />
    </>
  )
}

export default MarketingContent
