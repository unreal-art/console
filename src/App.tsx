import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createBrowserRouter, RouterProvider } from "react-router"
import { ApiProvider } from "./lib/ApiContext"
import { useEffect } from "react"
import { useAppStore } from "@/store/appStore"

// Import pages
import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import Settings from "./pages/Settings"
import Login from "./pages/Login"
import SignIn from "./pages/SignIn"
import NotFound from "./pages/NotFound"
import Playground from "./pages/Playground"
import PlaygroundLive from "./pages/PlaygroundLive"
import Airdrop from "./pages/Airdrop"

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/playground",
    element: <Playground />,
  },
  {
    path: "/playground-live",
    element: <PlaygroundLive />,
  },
  {
    path: "/airdrop",
    element: <Airdrop />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/sign-in",
    element: <SignIn />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
])

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
          <RouterProvider router={router} />
        </TooltipProvider>
      </ApiProvider>
    </QueryClientProvider>
  )
}

export default App
