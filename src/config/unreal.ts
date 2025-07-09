import { parseEther, type Address } from "viem"
export const UNREAL_AMOUNT = parseEther(`${1}`)
import axios from "axios"

export const UNREAL_ADDRESS =
  "0xA409B5E5D34928a0F1165c7a73c8aC572D1aBCDB".toLowerCase() as unknown as Address

export const OPENAI_URL =
  import.meta.env.VITE_OPENAI_URL || "https://openai.unreal.art/v1"

console.log("OPENAI_URL", OPENAI_URL)
export const openaiClient = axios.create({
  baseURL: OPENAI_URL,
  headers: {
    "Content-Type": "application/json",
  },
})
openaiClient.defaults.withCredentials = true

// Add interceptor to inject Authorization header if token is present in localStorage
openaiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("unreal_token")
  if (token) {
    config.headers = config.headers || {}
    config.headers["Authorization"] = `Bearer ${token}`
  }
  return config
})
