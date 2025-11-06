import React from "react"
import Layout from "@/components/Layout"
import LiveChatPlayground from "@/components/LiveChatPlayground"
import { useNavigate, useSearchParams } from "react-router"
import { ArrowLeft } from "lucide-react"

const PlaygroundLive: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialPrompt = searchParams.get("prompt") || undefined
  const autorun = ["1", "true", "yes"].includes((searchParams.get("autorun") || "").toLowerCase())

  return (
    <Layout>
      <div className="w-full px-4 py-4 md:py-6">
        <div className="mb-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
        <LiveChatPlayground initialPrompt={initialPrompt} autorun={autorun} />
      </div>
    </Layout>
  )
}

export default PlaygroundLive
