# Unreal Console

**Developer Dashboard for API Management & Integration**

Unreal Console is a sleek, modern React-based dashboard that enables businesses and developers to authenticate, generate API keys, and seamlessly integrate their applications with Unreal's OpenAI-compatible backend. It serves as the front-end interface for the OpenAI Router, providing intuitive tools for API management and usage monitoring.

> 🔾 Connect, authenticate, and deploy AI in minutes.

---

## ✨ Key Features

• **Web3 Authentication** – Secure wallet-based login
• **API Key Management** – Generate, view, and revoke API keys
• **Usage Dashboard** – Real-time monitoring of API consumption
• **Chat Playground** – Test API functionality directly in the console
• **Multi-Page Architecture** – Organized workflow with dedicated sections
• **Interactive Onboarding** – Guided setup for new developers
• **Token-Based Access** – On-chain payment and authentication

---

## 🗺️ Application Structure

```
unreal-console/
├─ src/
│  ├─ components/     # Reusable UI components
│  ├─ pages/         # Application pages
│  ├─ lib/           # Core functionality and context
│  ├─ hooks/         # Custom React hooks
│  ├─ abis/          # Blockchain contract ABIs
│  └─ config/        # Application configuration
├─ public/          # Static assets
└─ tests/           # Playwright E2E tests
```

---

## 📡 Key Pages

| Page      | Description                                       |
|-----------|---------------------------------------------------|
| Home      | Landing page with onboarding flow                 |
| Login     | Wallet connection and authentication              |
| Dashboard | API key status and usage statistics               |
| Chat      | Interactive chat completion API testing           |
| Settings  | API key management and account settings           |

---

## 🛠️ Tech Stack

- **Frontend Framework**: React with Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Authentication**: Web3 wallet integration via Viem
- **Routing**: React Router
- **Testing**: Playwright for E2E testing

---

## 🧩 Development

```bash
# Setup development environment
npm run setup:min

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

---

## 🔌 Integration Flow

Unreal Console works as part of a complete API management solution:

1. **Connect** your wallet to authenticate
2. **Configure** your API access with custom keys
3. **Test** API functionality in the playground
4. **Monitor** usage and manage costs
5. **Integrate** your applications with the OpenAI-compatible API

---

## 📜 License

MIT © Unreal AI contributors
