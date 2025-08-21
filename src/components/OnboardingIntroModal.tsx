import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApi } from "@/lib/ApiContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, ArrowRight } from "lucide-react"

interface OnboardingIntroModalProps {
  onStart: () => void
}

const OnboardingIntroModal: React.FC<OnboardingIntroModalProps> = ({ onStart }) => {
  const navigate = useNavigate()
  const { isAuthenticated, verifyData, apiKey, apiKeyHash } = useApi()
  const [open, setOpen] = useState(false)

  // Show only on first visit
  useEffect(() => {
    const seen = localStorage.getItem("unreal_onboarding_seen")
    if (!seen) {
      setOpen(true)
      localStorage.setItem("unreal_onboarding_seen", "1")
    }
  }, [])

  const hasApiKey = useMemo(() => Boolean(apiKeyHash || apiKey), [apiKey, apiKeyHash])

  const statusItem = (label: string, done: boolean) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-slate-500" />
        )}
        <span>{label}</span>
      </div>
      <Badge variant={done ? "default" : "secondary"} className={done ? "bg-green-600" : "bg-slate-700"}>
        {done ? "Done" : "Pending"}
      </Badge>
    </div>
  )

  const handleTrySample = () => {
    const sample = encodeURIComponent("Write a concise TypeScript function called `toTitleCase` that converts a string to Title Case, followed by a short usage example.")
    navigate(`/playground?prompt=${sample}&autorun=1`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Welcome to Unreal Console</DialogTitle>
          <DialogDescription>
            OpenAI-compatible API with wallet auth, keys, and live streaming. Follow these quick steps or try a sample prompt immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {statusItem("Connect wallet", isAuthenticated)}
          {statusItem("Register business", Boolean(verifyData))}
          {statusItem("Generate API key", hasApiKey)}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-4">
          <div className="flex gap-2 order-2 sm:order-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>Skip for now</Button>
            <Button variant="outline" onClick={() => { setOpen(false); onStart(); }}>
              Start guided onboarding
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <Button className="order-1 sm:order-2" onClick={handleTrySample}>
            Try a sample prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingIntroModal
