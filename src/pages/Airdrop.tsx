import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { apiClient, type AirdropResponse } from "@/lib/api"
import { getPublicClient } from "@/config/wallet"
import { useApi } from "@/lib/ApiContext"
import { ExternalLink, Check, Twitter, Linkedin, Loader2 } from "lucide-react"

const X_URL = "https://x.com/ideomind"
const LINKEDIN_URL = "https://www.linkedin.com/company/unreal-art"

const Airdrop: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, connectWallet, getCurrentChainId, logout } = useApi()

  // Follow + verification state
  const [followedX, setFollowedX] = useState(false)
  const [followedLinkedIn, setFollowedLinkedIn] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyProgress, setVerifyProgress] = useState(0)
  const [verified, setVerified] = useState(false)
  const [verifyStartTime, setVerifyStartTime] = useState<number | null>(null)
  const MIN_VERIFY_MS = 30_000
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  // Claim + confirmation state
  const [isClaiming, setIsClaiming] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmationStartTime, setConfirmationStartTime] = useState<
    number | null
  >(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Refs for keyboard focus
  const verifyBtnRef = useRef<HTMLButtonElement | null>(null)
  const claimBtnRef = useRef<HTMLButtonElement | null>(null)

  // Derived state
  const canVerify = useMemo(
    () => followedX && followedLinkedIn && !verifying && !verified,
    [followedX, followedLinkedIn, verifying, verified]
  )
  const canClaim = useMemo(
    () => verified && isAuthenticated && !isClaiming && !isConfirming,
    [verified, isAuthenticated, isClaiming, isConfirming]
  )

  useEffect(() => {
    // Auto-focus Verify button on mount
    verifyBtnRef.current?.focus()
  }, [])

  useEffect(() => {
    let interval: number | null = null
    if (verifying && verifyStartTime !== null) {
      interval = window.setInterval(() => {
        const elapsed = Date.now() - verifyStartTime
        const pct = Math.min(100, Math.floor((elapsed / MIN_VERIFY_MS) * 100))
        setVerifyProgress(pct)
        const remaining = Math.max(0, Math.ceil((MIN_VERIFY_MS - elapsed) / 1000))
        setRemainingSeconds(remaining)
        if (elapsed >= MIN_VERIFY_MS) {
          if (interval) window.clearInterval(interval)
          setVerifying(false)
          setVerified(true)
          setRemainingSeconds(0)
          // Move focus to Claim when done
          setTimeout(() => claimBtnRef.current?.focus(), 50)
        }
      }, 100)
    }
    return () => {
      if (interval) window.clearInterval(interval)
    }
  }, [verifying, verifyStartTime])

  // Elapsed timer while confirming
  useEffect(() => {
    let timer: number | null = null
    if (isConfirming && confirmationStartTime) {
      timer = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - confirmationStartTime) / 1000))
      }, 1000)
    } else {
      setElapsedTime(0)
    }
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [isConfirming, confirmationStartTime])

  const handleStartVerification = useCallback(() => {
    if (!canVerify) return
    setVerifyProgress(0)
    setVerifyStartTime(Date.now())
    setRemainingSeconds(Math.ceil(MIN_VERIFY_MS / 1000))
    setVerifying(true)
  }, [canVerify])

  const handleClaim = useCallback(async () => {
    if (!canClaim) return
    setIsClaiming(true)
    try {
      const response: AirdropResponse = await apiClient.airdrop()
      if (response && response.txHash) {
        setTxHash(response.txHash)
        if (response.alreadyClaimed && response.confirmed) {
          setSuccess(true)
          toast({
            title: "Airdrop Already Claimed",
            description:
              response.message || "You have already claimed your airdrop.",
          })
          
          // Logout user after successful airdrop (already claimed)
          setTimeout(async () => {
            try {
              await logout()
              navigate('/sign-in')
            } catch (error) {
              console.error("Error during logout after airdrop:", error)
            }
          }, 2000) // Wait 2 seconds to let user see the success message
          return
        }
        // Wait for confirmation
        setIsConfirming(true)
        setConfirmationStartTime(Date.now())
        toast({
          title: response.alreadyClaimed
            ? "Airdrop Already Claimed (Unconfirmed)"
            : "Transaction Submitted",
          description:
            response.message ||
            "Waiting for blockchain confirmation. This may take a minute or two.",
        })
        try {
          const chainId = await getCurrentChainId()
          const publicClient = getPublicClient(chainId)
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: response.txHash as `0x${string}`,
            confirmations: 1,
            timeout: 20 * 60 * 1e3,
            pollingInterval: 10e3,
          })
          console.debug("Airdrop confirmed:", receipt)
          setIsConfirming(false)
          setSuccess(true)
          toast({
            title: "Airdrop Confirmed",
            description: "Your airdrop has been confirmed on-chain.",
          })
          
          // Logout user after successful airdrop
          setTimeout(async () => {
            try {
              await logout()
              navigate('/sign-in')
            } catch (error) {
              console.error("Error during logout after airdrop:", error)
            }
          }, 2000) // Wait 2 seconds to let user see the success message
        } catch (confirmationError) {
          console.error("Error waiting for confirmation:", confirmationError)
          setIsConfirming(false)
          toast({
            title: "Confirmation Error",
            description:
              "Could not confirm transaction. You may check the status later.",
            variant: "destructive",
          })
        }
      } else {
        throw new Error("Invalid response from airdrop endpoint")
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to request airdrop. Please try again."
      console.error("Airdrop error:", error)
      toast({
        title: "Airdrop Error",
        description: msg,
        variant: "destructive",
      })
      setSuccess(false)
    } finally {
      setIsClaiming(false)
    }
  }, [canClaim, getCurrentChainId])

  // Open centered popup for social follows
  const openPopupCentered = useCallback(
    (url: string, name: string, width = 700, height = 800) => {
      const win = window as Window & { screenLeft?: number; screenTop?: number }
      const dualScreenLeft = win.screenLeft ?? window.screenX ?? 0
      const dualScreenTop = win.screenTop ?? window.screenY ?? 0
      const w =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        window.screen.width
      const h =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        window.screen.height
      const left = dualScreenLeft + (w - width) / 2
      const top = dualScreenTop + (h - height) / 2
      const features = `popup=yes,width=${width},height=${height},top=${Math.max(
        0,
        Math.floor(top)
      )},left=${Math.max(0, Math.floor(left))},resizable=yes,scrollbars=yes,noopener,noreferrer`
      const newWindow = window.open(url, name, features)
      if (newWindow) {
        try {
          newWindow.opener = null
          newWindow.focus()
        } catch {
          // no-op
        }
      } else {
        // Fallback to new tab if popup blocked
        window.open(url, "_blank", "noopener,noreferrer")
      }
    },
    []
  )

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        (target?.isContentEditable ?? false)
      if (isTyping) return
      const key = e.key?.toLowerCase?.() ?? ""

      // Enter: primary action
      if (key === "enter") {
        e.preventDefault()
        if (!verified) {
          handleStartVerification()
        } else {
          handleClaim()
        }
        return
      }

      // Esc: cancel verification progress
      if (key === "escape") {
        if (verifying) {
          e.preventDefault()
          setVerifying(false)
          setVerifyProgress(0)
          setVerifyStartTime(null)
          setRemainingSeconds(0)
        }
        return
      }

      // Shortcuts
      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        switch (key) {
          case "x":
            openPopupCentered(X_URL, "FollowX", 700, 800)
            setFollowedX(true)
            break
          case "l":
            openPopupCentered(LINKEDIN_URL, "FollowLinkedIn", 700, 800)
            setFollowedLinkedIn(true)
            break
          case "v":
            handleStartVerification()
            break
          case "c":
            handleClaim()
            break
          default:
            break
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleStartVerification, handleClaim, verifying, verified, openPopupCentered])

  const handleConnect = async () => {
    try {
      await connectWallet()
      toast({
        title: "Wallet Connected",
        description: "Proceed to claim your airdrop.",
      })
    } catch (e) {
      // error surfaced via context
    }
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">Community Airdrop</h1>
        <p className="text-muted-foreground mb-6">
          Follow our social accounts, run a quick verification, then claim your
          free UNREAL test tokens.
        </p>

        {/* Follow section */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  Step 1 — Follow us
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Follow both accounts to unlock verification.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant={followedX ? "secondary" : "default"}
                    onClick={() => {
                      openPopupCentered(X_URL, "FollowX", 700, 800)
                      setFollowedX(true)
                    }}
                    title="Open X (Twitter) • Shortcut: X"
                    className="inline-flex items-center gap-2"
                  >
                    <Twitter className="h-4 w-4" /> Follow on X
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    {followedX && <Check className="h-4 w-4 text-green-600" />}
                  </Button>
                  <Button
                    variant={followedLinkedIn ? "secondary" : "default"}
                    onClick={() => {
                      openPopupCentered(
                        LINKEDIN_URL,
                        "FollowLinkedIn",
                        700,
                        800
                      )
                      setFollowedLinkedIn(true)
                    }}
                    title="Open LinkedIn • Shortcut: L"
                    className="inline-flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" /> Follow on LinkedIn
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    {followedLinkedIn && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification section */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold mb-3">
              Step 2 — Verify follows
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              We do a quick verification to keep things simple. Once complete,
              you can claim.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <Button
                ref={verifyBtnRef}
                onClick={handleStartVerification}
                disabled={!canVerify}
                title={
                  canVerify
                    ? "Start verification • Enter or V"
                    : "Follow both accounts to enable verification"
                }
              >
                {verifying ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                  </span>
                ) : verified ? (
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" /> Verified
                  </span>
                ) : (
                  "Verify Follows"
                )}
              </Button>
              {verifying && (
                <span className="text-sm text-muted-foreground">
                  Press Esc to cancel • ~{remainingSeconds}s remaining
                </span>
              )}
            </div>
            <Progress value={verified ? 100 : verifyProgress} className="h-2" />
          </CardContent>
        </Card>

        {/* Claim section */}
        <Card>
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold mb-3">
              Step 3 — Claim airdrop
            </h2>
            {!isAuthenticated && (
              <div className="mb-4 p-3 border rounded bg-muted/40">
                <p className="text-sm mb-2">
                  Connect your wallet and sign in to claim.
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleConnect}>
                    Connect Wallet
                  </Button>
                  <a href="/sign-in" className="text-sm underline">
                    Go to Sign In
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <Button
                ref={claimBtnRef}
                onClick={handleClaim}
                disabled={!canClaim}
                title={
                  canClaim
                    ? "Claim Airdrop • Enter or C"
                    : verified
                    ? isAuthenticated
                      ? "Please wait…"
                      : "Connect wallet to claim"
                    : "Verify first to enable claim"
                }
              >
                {isClaiming || isConfirming ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />{" "}
                    {isConfirming ? "Confirming…" : "Requesting…"}
                  </span>
                ) : (
                  "Claim Airdrop"
                )}
              </Button>
              {txHash && (
                <span className="text-xs text-muted-foreground break-all">
                  tx: {txHash}
                </span>
              )}
            </div>
            {isConfirming && (
              <div className="text-sm text-muted-foreground">
                Waiting for confirmation… {elapsedTime}s
              </div>
            )}
            {success && (
              <div className="mt-3 text-sm text-green-600 inline-flex items-center gap-2">
                <Check className="h-4 w-4" /> Airdrop received!
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-xs text-muted-foreground">
          Shortcuts: X (open X), L (open LinkedIn), V (verify), C (claim), Enter
          (primary), Esc (cancel verification)
        </div>
      </div>
    </Layout>
  )
}

export default Airdrop
