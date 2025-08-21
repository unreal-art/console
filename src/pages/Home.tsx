import React from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { useNavigate, useSearchParams } from "react-router-dom"
import MarketingContent from "@/components/MarketingContent"
import OnboardingIntroModal from "@/components/OnboardingIntroModal"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const forceOpen = searchParams.get("onboarding") === "1" || searchParams.get("guided") === "1"
  const handleStart = () => navigate("/settings")
  return (
    <Layout>
      <OnboardingIntroModal onStart={handleStart} forceOpen={forceOpen} />
      <section className="py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Unreal Console</h1>
          <p className="text-lg text-muted-foreground mb-8">
            OpenAI-compatible API. Wallet-auth, keys, and live streaming demos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => navigate("/chat")} className="px-6">
                  Open Chat Demo
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat with the model using your API key</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => navigate("/playground")} variant="outline" className="px-6">
                  Open Playground
                </Button>
              </TooltipTrigger>
              <TooltipContent>Run a streaming completion with live output</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => navigate("/settings")} variant="ghost" className="px-6">
                  Go to Settings
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create and manage your API keys</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </section>
      <MarketingContent />
    </Layout>
  )
}

export default Home
