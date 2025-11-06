import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { useApi } from "@/lib/ApiContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, ArrowRight } from "lucide-react"

interface OnboardingIntroModalProps {
  onStart: () => void
  forceOpen?: boolean
}

const OnboardingIntroModal: React.FC<OnboardingIntroModalProps> = ({ onStart, forceOpen }) => {
  const navigate = useNavigate()
  const { isAuthenticated, token, verifyData, verifyToken, apiKey, apiKeyHash, walletAddress } = useApi()
  const [open, setOpen] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Keyboard navigation state and refs for action buttons
  const skipRef = useRef<HTMLButtonElement>(null)
  const guidedRef = useRef<HTMLButtonElement>(null)
  const tryRef = useRef<HTMLButtonElement>(null)
  const [activeIndex, setActiveIndex] = useState<number>(1) // 0: Skip, 1: Guided, 2: Try sample

  // Show only on first visit
  useEffect(() => {
    const seen = localStorage.getItem("unreal_onboarding_seen")
    if (!seen) {
      setOpen(true)
      localStorage.setItem("unreal_onboarding_seen", "1")
    }
  }, [])

  // Allow replay via forceOpen
  useEffect(() => {
    if (forceOpen) {
      setOpen(true)
    }
  }, [forceOpen])

  // Default focus when modal opens
  useEffect(() => {
    if (open) {
      setActiveIndex(1)
      // Delay to ensure elements are rendered
      setTimeout(() => guidedRef.current?.focus(), 0)
    }
  }, [open])

  const hasApiKey = useMemo(() => Boolean(apiKeyHash || apiKey), [apiKey, apiKeyHash])

  const statusItem = (label: string, done: boolean) => (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-slate-500" />
        )}
        <span className="break-words">{label}</span>
      </div>
      <Badge
        variant={done ? "default" : "secondary"}
        className={done ? "bg-green-600 shrink-0" : "bg-slate-700 shrink-0"}
      >
        {done ? "Done" : "Pending"}
      </Badge>
    </div>
  )

  const handleTrySample = useCallback(() => {
    const sample = encodeURIComponent("Write a concise TypeScript function called `toTitleCase` that converts a string to Title Case, followed by a short usage example.")
    navigate(`/playground?prompt=${sample}&autorun=1`)
    setOpen(false)
  }, [navigate])

  const handleVerify = async () => {
    try {
      setVerifying(true)
      await verifyToken()
    } catch (e) {
      // error state handled by context
    } finally {
      setVerifying(false)
    }
  }

  // Modal keyboard shortcuts
  useEffect(() => {
    if (!open) return

    const buttons = [skipRef, guidedRef, tryRef]
    const focusIdx = (idx: number) => {
      setActiveIndex(idx)
      setTimeout(() => buttons[idx]?.current?.focus(), 0)
    }

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isTyping = tag === "input" || tag === "textarea" || (target?.isContentEditable ?? false)
      const key = e.key?.toLowerCase?.() ?? ""

      // Esc always closes
      if (key === "escape") {
        e.preventDefault()
        setOpen(false)
        return
      }

      if (isTyping) return

      // Quick actions
      if (key === "s") {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (key === "t") {
        e.preventDefault()
        // Try sample
        tryRef.current?.focus()
        setActiveIndex(2)
        // Small delay to ensure focus-visible, then run
        setTimeout(() => {
          // Use the existing handler to navigate
          handleTrySample()
        }, 0)
        return
      }

      // Selection confirm
      if (key === "enter") {
        e.preventDefault()
        if (activeIndex === 0) {
          setOpen(false)
        } else if (activeIndex === 1) {
          setOpen(false)
          onStart()
        } else {
          // Try sample
          handleTrySample()
        }
        return
      }

      // Roving focus
      if (key === "arrowleft") {
        e.preventDefault()
        focusIdx((activeIndex + 2) % 3)
        return
      }
      if (key === "arrowright") {
        e.preventDefault()
        focusIdx((activeIndex + 1) % 3)
        return
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, activeIndex, onStart, handleTrySample])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-w-[calc(100vw-2rem)] overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Welcome to Unreal Console</DialogTitle>
          <DialogDescription className="break-words">
            OpenAI-compatible API with wallet auth, keys, and live streaming. Go to the Sign-In page to connect your wallet, choose a network and payment token, then sign in to receive a session token (cookie). You can call <code>/auth/verify</code> to see auth details. Finally, go to Settings to create an API key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {statusItem("Connect wallet", Boolean(walletAddress))}
          {statusItem("Sign in (session token)", Boolean(token))}
          {/* Optional verify helper */}
          {token && !verifyData && (
            <div className="flex flex-wrap items-center justify-between gap-2 py-1">
              <span className="text-sm text-slate-400">Optionally verify session</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleVerify}
                disabled={verifying}
                className="w-full sm:w-auto"
              >
                {verifying ? "Verifying..." : "Verify session"}
              </Button>
            </div>
          )}
          {statusItem("Generate API key", hasApiKey)}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-4 w-full">
          <div className="flex flex-col sm:flex-row gap-2 order-2 sm:order-1 w-full sm:w-auto">
            <Button
              ref={skipRef}
              title="Skip (S or Esc)"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Skip for now
            </Button>
            <Button
              ref={guidedRef}
              title="Start guided onboarding (Enter)"
              variant="outline"
              onClick={() => {
                setOpen(false)
                onStart()
              }}
              className="w-full sm:w-auto max-w-full whitespace-normal break-words"
            >
              <span className="hidden sm:inline">Start guided onboarding</span>
              <span className="inline sm:hidden">Start guided</span>
              <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
            </Button>
          </div>
          <Button
            ref={tryRef}
            title="Try a sample prompt (T)"
            className="order-1 sm:order-2 w-full sm:w-auto max-w-full whitespace-normal break-words"
            onClick={handleTrySample}
          >
            <span className="hidden sm:inline">Try a sample prompt</span>
            <span className="inline sm:hidden">Try sample</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingIntroModal
