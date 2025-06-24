# Hyperliquid UI Clone

This project is a clone of the Hyperliquid trading terminal, built from scratch using Next.js, TypeScript, Tailwind CSS, and Shadcn UI. It implements core trading features, including wallet connection, live-price feeds, an order book, and user-specific data streams, all powered by direct WebSocket subscriptions to the Hyperliquid API.

## Core Features

-   **Wallet Integration**: Connect and disconnect using Privy with embedded wallet support.
-   **Live Data Feeds**: Real-time subscriptions for:
    -   Order Book (L2)
    -   Recent Trades
    -   Asset Stats (24h Volume, Funding, Open Interest)
    -   User-Specific Events (Positions, Balances)
-   **TradingView Charts**: Dynamic, real-time charting for selected assets.
-   **On-Chain Actions**:
    -   Agent Approval: Securely sign and approve an agent address for API trading.
    -   Market Orders: (Scaffolded) Place market orders with signature verification.
-   **Resilient Connectivity**:
    -   A custom `useWebSocket` hook provides automatic reconnection with exponential backoff.
    -   A `fetchWithRetry` utility handles HTTP rate-limiting (429 errors) gracefully.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with Turbopack)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
-   **Wallet/Web3**: [Privy](https://www.privy.io/) & [Wagmi](https://wagmi.sh/)
-   **State Management**: React Hooks & Context
-   **Charting**: [TradingView Advanced Real-Time Chart Widget](https://www.tradingview.com/widget/)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/en) (v18 or later)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/romanzalov/hyperliquid-clone
cd hyperliquid-clone
npm install
```

### 3. Environment Setup

You need a Privy App ID to handle wallet connections. Create a `.env.local` file in the project root and add your ID:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```

The application connects to the Hyperliquid mainnet by default. No further API keys are needed.

### 4. Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Running Tests

This project uses Jest and React Testing Library for unit and integration tests.

### 1. Setup

The necessary development dependencies are already listed in `package.json`.

### 2. Executing Tests

To run the test suite, execute the following command:

```bash
npm test
```

This will run all tests located in `__tests__` directories and provide a summary report in your terminal.
