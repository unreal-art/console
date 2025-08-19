import React from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

const Home: React.FC = () => {
  const navigate = useNavigate()
  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Unreal Console</h1>
          <p className="text-lg text-muted-foreground mb-8">
            OpenAI-compatible API. Wallet-auth, keys, and live streaming demos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/chat")} className="px-6">
              Open Chat Demo
            </Button>
            <Button onClick={() => navigate("/playground")} variant="outline" className="px-6">
              Open Playground
            </Button>
            <Button onClick={() => navigate("/settings")} variant="ghost" className="px-6">
              Go to Settings
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default Home
