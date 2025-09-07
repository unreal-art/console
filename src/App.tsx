import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ApiProvider } from "./lib/ApiContext"
import { useEffect } from "react"
import { WalletProviders } from "./lib/WalletProviders"
import { useAppStore } from "@/store/appStore"

// Import pages
import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import Settings from "./pages/Settings"
import Login from "./pages/Login"
import SignIn from "./pages/SignInPrivy"
import NotFound from "./pages/NotFound"
import Playground from "./pages/Playground"
import Airdrop from "./pages/Airdrop"

const queryClient = new QueryClient()

const App = () => {
  // Hydrate the app store once on startup
  useEffect(() => {
    try {
      void useAppStore.getState().hydrate()
    } catch (_) {
      // ignore hydration errors
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/airdrop" element={<Airdrop />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              {/* Mount Privy + wagmi + RainbowKit only for the sign-in route */}
              <Route path="/sign-in" element={<WalletProviders><SignIn /></WalletProviders>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ApiProvider>
    </QueryClientProvider>
  )
}

export default App
