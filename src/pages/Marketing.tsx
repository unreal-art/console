import React, { useState } from "react"
import Layout from "@/components/Layout"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FeatureCards from "@/components/FeatureCards"
import TestimonialCarousel from "@/components/TestimonialCarousel"
import FAQ from "@/components/FAQ"
import { Check, Copy, Globe } from "lucide-react"

const Marketing: React.FC = () => {
  const [copied, setCopied] = useState(false)

  const codeExamples = {
    curl: `curl -X POST "https://openai.unreal.art/v1/chat/completions" \\\n  -H "Authorization: Bearer your-api-key-here" \\\n  -H "Content-Type: application/json" \\\n  -d '{
    "model": "unreal::mixtral-8x22b-instruct",
    "messages": [{"role": "user", "content": "Hello world!"}]
  }'`,
    python: `import openai

client = openai.OpenAI(
    api_key="your-api-key-here",
    base_url="https://openai.unreal.art/v1"
)

response = client.chat.completions.create(
    model="unreal::mixtral-8x22b-instruct",
    messages=[{"role": "user", "content": "Hello world!"}]
)

print(response.choices[0].message.content)`,
    javascript: `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your-api-key-here',
  baseURL: 'https://openai.unreal.art/v1'
});

const response = await client.chat.completions.create({
  model: 'unreal::mixtral-8x22b-instruct',
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
    <Layout>
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

      {/* App Availability */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-6">Available Everywhere</h2>
            <p className="text-xl text-slate-300 mb-12">
              Beta launches August 2nd, 2025. Get early access now.
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-xl font-semibold mb-2">Web Console</h3>
                  <p className="text-slate-400 mb-4">Full-featured dashboard</p>
                  <Badge className="bg-green-600">Live Now</Badge>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    📱
                  </div>
                  <h3 className="text-xl font-semibold mb-2">iOS App</h3>
                  <p className="text-slate-400 mb-4">Native mobile experience</p>
                  <Button variant="outline" size="sm">Notify Me</Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    🤖
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Android App</h3>
                  <p className="text-slate-400 mb-4">Cross-platform support</p>
                  <Button variant="outline" size="sm">Notify Me</Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialCarousel />

      {/* FAQ */}
      <FAQ />
    </Layout>
  )
}

export default Marketing
