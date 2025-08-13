import React, { useEffect } from "react"
import { useDisconnect, useActiveWallet } from "thirdweb/react"
import { useApi } from "./ApiContext"

/**
 * ThirdwebDisconnectBridge
 *
 * Mount this component anywhere INSIDE your ThirdwebProvider.
 * It registers thirdweb's disconnect(wallet) with ApiContext so that
 * calling `logout()` fully disconnects the thirdweb session before reload.
 */
export default function ThirdwebDisconnectBridge() {
  const { registerWalletDisconnector } = useApi()
  const { disconnect } = useDisconnect()
  const wallet = useActiveWallet()

  useEffect(() => {
    if (wallet) {
      // Register a disconnector that targets the current active wallet
      registerWalletDisconnector(() => disconnect(wallet))
      return () => registerWalletDisconnector(null)
    }
    // No active wallet: clear any disconnector
    registerWalletDisconnector(null)
    return () => registerWalletDisconnector(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, disconnect])

  return null
}
