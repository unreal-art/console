import React, { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  ArrowRight,
  Code,
  Shield,
  Zap,
  Globe,
  Copy,
  Check,
  Play,
  ChevronDown,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import AnimatedBackground from "@/components/AnimatedBackground"
import CodePlayground from "@/components/CodePlayground"
import FeatureCards from "@/components/FeatureCards"
import TestimonialCarousel from "@/components/TestimonialCarousel"
import FAQ from "@/components/FAQ"
import OnboardingFlow from "@/components/OnboardingFlow"
import ChatCompletion from "@/components/ChatCompletion"
import { useOpenWidget } from "@/hooks/useOpenWidget"
import { useApi } from "@/lib/ApiContext"
import { OPENAI_DOCS_URL } from "@/config/unreal"

const Index = () => {
  const [copied, setCopied] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 300], [0, -50])
  const opacity = useTransform(scrollY, [0, 300], [1, 0.8])

  // Initialize Open Widget
  const { toggleWidget } = useOpenWidget()

  // Get API context
  const {
    isAuthenticated,
    isLoading,
    walletAddress,
    token,
    verifyData,
    apiKey,
    error,
    connectWallet,
    verifyToken,
    logout,
  } = useApi()

  // Create a ref to track verification attempts outside the useEffect
  const verificationAttempted = useRef(false);

  // Verify token on load if authenticated
  useEffect(() => {
    // Only verify token if authenticated, token exists, and we don't already have verification data
    if (isAuthenticated && token && !verifyData && !verificationAttempted.current) {
      // Mark that we've attempted verification to prevent repeated calls
      verificationAttempted.current = true;
      
      verifyToken().catch((error) => {
        console.error("Token verification failed:", error);
      });
    } else if (!token) {
      // Reset the verification flag when token is cleared
      verificationAttempted.current = false;
    }
  }, [isAuthenticated, token, verifyData, verifyToken])

  useEffect(() => {
    const targetDate = new Date("August 2, 2025 00:00:00").getTime()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate - now

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      )
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const trustBadges = [
    "Secured by Blockchain",
    "OpenAI-Compatible",
    "Backed by DecenterAI",
    "3,500+ Businesses Onboarded",
  ]

  const codeExamples = {
    curl: `curl -X POST "https://openai.unreal.art/v1/chat/completions" \\
  -H "Authorization: Bearer your-api-key-here" \\
  -H "Content-Type: application/json" \\
  -d '{
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

  const onboardingRef = useRef<HTMLDivElement | null>(null)

  const scrollToOnboarding = () => {
    onboardingRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const handleWalletConnect = async () => {
    try {
      if (isAuthenticated) {
        logout()
      } else {
        await connectWallet()
      }
      scrollToOnboarding()
    } catch (error) {
      console.error("Wallet connection error:", error)
    }
  }

  const handleViewDocs = () => {
    // Open docs URL in a new tab
    window.open(OPENAI_DOCS_URL, '_blank')
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      <AnimatedBackground />

      {/* Sticky CTA Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="logo.webp" alt="Unreal AI Logo" className="w-8 h-8" />
            <span className="font-bold text-lg">Unreal AI</span>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={handleWalletConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                Loading...
              </span>
            ) : isAuthenticated ? (
              <>Disconnect Wallet</>
            ) : (
              <>
                Connect Wallet & Get API Key
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center pt-20"
        style={{ y: heroY, opacity }}
      >
        <div className="container mx-auto px-6 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              The Open, On-Chain
              <br />
              AI API for Builders
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Connect your wallet. Register your business. Instantly generate
              secure API keys for OpenAI-compatible inference—settled
              transparently on-chain.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
                onClick={handleWalletConnect}
              >
                Connect Wallet & Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 hover:bg-slate-800 text-lg px-8 py-4"
                onClick={handleViewDocs}
              >
                View API Docs
                <Code className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {trustBadges.map((badge, index) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Badge
                    variant="secondary"
                    className="bg-slate-800/50 text-slate-300 px-4 py-2"
                  >
                    {badge}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Onboarding Flow */}
      <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
        <div ref={onboardingRef}>
          <OnboardingFlow />
        </div>
      </section>

      {/* Chat Completion Demo */}
      {isAuthenticated && apiKey && (
        <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Test Your API Key</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Try out your new API key with our chat completion endpoint. This
              demo shows how to use the API in a real application.
            </p>
          </div>
          <ChatCompletion />
        </section>
      )}

      {/* Code Examples Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-6">
              Works with Your Favorite SDKs
            </h2>
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
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
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

      {/* Code Playground */}
      <CodePlayground />

      {/* Feature Cards */}
      <FeatureCards />

      {/* Testimonials */}
      <TestimonialCarousel />

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
                  <p className="text-slate-400 mb-4">
                    Native mobile experience
                  </p>
                  <Button variant="outline" size="sm">
                    Notify Me
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    🤖
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Android App</h3>
                  <p className="text-slate-400 mb-4">Cross-platform support</p>
                  <Button variant="outline" size="sm">
                    Notify Me
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="logo.webp" alt="Unreal AI Logo" className="w-8 h-8" />
                <span className="font-bold text-lg">Unreal AI</span>
              </div>
              <p className="text-slate-400">
                The open, on-chain AI API platform for businesses.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Developers</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a
                    href="https://discord.com/invite/VzPQBKJ5EK"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/ideomind"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/unreal-art"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>© 2025 Unreal AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Index
