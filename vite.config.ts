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
      dedupe: ["zod"],
      include: ["zod"],
    },
    resolve: {
      alias: {
        zod: path.resolve(__dirname, "./node_modules/zod"),
        "@": path.resolve(__dirname, "./src"),
        "@config": path.resolve(__dirname, "./src/config"),
        "@abis": path.resolve(__dirname, "./src/abis"),
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
