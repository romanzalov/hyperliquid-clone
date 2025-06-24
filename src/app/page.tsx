"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { AssetSelector } from "@/components/asset-selector";
import { OrderBook } from "@/components/order-book";
import { UserFeeds } from "@/components/user-feeds";
import { ConnectWallet } from "@/components/connect-wallet";
import { OrderEntry } from "@/components/order-entry";
import { StatsDisplay } from "@/components/stats-display";

const TradingChart = dynamic(() => import('@/components/trading-chart').then(mod => mod.TradingChart), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center"><p>Loading Chart...</p></div>
});

export default function Home() {
    const [selectedAsset, setSelectedAsset] = React.useState<string>("BTC");
  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <AssetSelector selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} />
          <StatsDisplay symbol={selectedAsset} />
        </div>
        <ConnectWallet />
      </div>
      <div className="flex-1 flex flex-col md:flex-row h-full min-h-0">
        <div className="flex flex-col w-full md:flex-grow h-full min-h-0">
          <div className="flex-grow h-[70%] min-h-0">
            <TradingChart symbol={`${selectedAsset.toLowerCase()}usd`} />
          </div>
          <div className="h-[30%] min-h-0">
            <UserFeeds />
          </div>
        </div>
        <div className="w-full md:w-1/4 h-full min-h-0">
          <OrderBook symbol={selectedAsset} />
        </div>
        <div className="w-full md:w-1/5 h-full min-h-0">
          <OrderEntry symbol={selectedAsset} />
        </div>
      </div>
    </div>
  );
}
