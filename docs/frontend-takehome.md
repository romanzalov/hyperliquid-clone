# Frontend Engineer Take-Home Assignment

Clone the Hyperliquid UI from scratch using TypeScript, Next.js, React, Tailwind, Shadcn, Privy and Wagmi.

## Core Features
1. Connect wallet
2. Asset ticker selection
3. Show live prices for selected ticker
   1. Feed the chart data using TradingView charts
   2. Live order book
4. Show user feeds such as orders, fills etc

## Bonus
1. User agent creation including on-chain registration
2. Implement market orders, including signing for user agent

## Requirements
1. The interface must work and be responsive
2. Must use websocket subscriptions for the real time data
3. The code must be implemented in a way that allows it to scale to a fully fledged trading terminal
4. Handle rate limits gracefully

## Resources
1. Use inspect page on Hyperliquid website to see the network requests it is making
2. Hyperliquid docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
3. Hyperliquid Python SDK, for reference: https://github.com/hyperliquid-dex/hyperliquid-python-sdk
