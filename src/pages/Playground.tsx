import React from "react"
import Layout from "@/components/Layout"
import ChatPlayground from "@/components/ChatPlayground"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const Playground: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialPrompt = searchParams.get("prompt") || undefined
  const autorun = ["1", "true", "yes"].includes((searchParams.get("autorun") || "").toLowerCase())
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-6">Chat Playground</h1>
        <ChatPlayground initialPrompt={initialPrompt} autorun={autorun} />
      </div>
    </Layout>
  )
}

export default Playground
