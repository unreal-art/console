import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"
import { componentTagger } from "lovable-tagger"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "")

  // console.log('Environment variables loaded:', env);

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean
    ),
    optimizeDeps: {
      force: true,
      dedupe: ["zod"],
      include: [
        "zod",
        "@web3-onboard/particle-network",
        "@particle-network/auth",
        "@particle-network/provider",
        "@particle-network/chains",
      ],
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
      },
    },
    resolve: {
      alias: {
        zod: path.resolve(__dirname, "./node_modules/zod"),
        "@": path.resolve(__dirname, "./src"),
        "@public": path.resolve(__dirname, "./public"),
        "@config": path.resolve(__dirname, "./src/config"),
        "@abis": path.resolve(__dirname, "./src/abis"),
        "@utils": path.resolve(__dirname, "./utils"),
        "@store": path.resolve(__dirname, "./src/store"),
        "zod/v4": "zod",
        "zod/v4-mini": "zod",
        "zod/v3": "zod",
      },
    },
    define: {
      "import.meta.env": JSON.stringify(env),
    },
  }
})
