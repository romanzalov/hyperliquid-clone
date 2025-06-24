"use client";

import React from "react";
import { useWebSocket } from "@/lib/useWebSocket";

interface PerpsAssetCtx {
  dayNtlVlm: number;
  prevDayPx: number;
  markPx: number;
  funding: number;
  openInterest: number;
  oraclePx: number;
}

interface StatsDisplayProps {
  symbol: string;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ symbol }) => {
  const [ctx, setCtx] = React.useState<PerpsAssetCtx | null>(null);
  const { lastMessage } = useWebSocket(
    'wss://api.hyperliquid.xyz/ws',
    [{ method: "subscribe", subscription: { type: "activeAssetCtx", coin: symbol } }]
  );
  const [countdown, setCountdown] = React.useState<string>("--:--:--");
  const [unit] = React.useState<string>("USD");

  React.useEffect(() => {
    if (!lastMessage) return;
    try {
      const data = JSON.parse(lastMessage.data);
      if (data.channel === "activeAssetCtx" && data.data?.ctx && data.data.coin === symbol) {
        const { ctx } = data.data;
        setCtx({
          dayNtlVlm: parseFloat(ctx.dayNtlVlm as string),
          prevDayPx: parseFloat(ctx.prevDayPx as string),
          markPx: parseFloat(ctx.markPx as string),
          funding: parseFloat(ctx.funding as string),
          openInterest: parseFloat(ctx.openInterest as string),
          oraclePx: parseFloat(ctx.oraclePx as string),
        });
      }
    } catch (error) {
      console.error("Error parsing StatsDisplay message:", error);
    }
  }, [lastMessage, symbol]);

  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      const diff = nextHour.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  if (!ctx) {
    return <div className="text-white">Loading...</div>;
  }

  const change = ctx.markPx - ctx.prevDayPx;
  const changePercent = (change / ctx.prevDayPx) * 100;
  const formattedChange = `${change >= 0 ? "+" : ""}${change.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const formattedChangePercent = `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`;
  const formattedMark = ctx.markPx.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedOracle = ctx.oraclePx.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedVolume = `$${ctx.dayNtlVlm.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const oiUsd = ctx.openInterest * ctx.markPx;
  const formattedOI = `$${oiUsd.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const formattedFundingRate = `${ctx.funding >= 0 ? "+" : ""}${(
    ctx.funding * 100
  ).toFixed(4)}%`;
  const assetVolumeNum = ctx.dayNtlVlm / ctx.markPx;
  const formattedAssetVolume = `${assetVolumeNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${symbol}`;
  const formattedAssetOI = `${ctx.openInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${symbol}`;

  return (
    <div className="flex items-center text-xs text-white space-x-4">
      <div>
        <div className="text-muted-foreground">Mark</div>
        <div>{formattedMark}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Oracle</div>
        <div>{formattedOracle}</div>
      </div>
      <div>
        <div className="text-muted-foreground">24h Change</div>
        <div className={`${change >= 0 ? "text-green-400" : "text-red-400"}`}>
          {formattedChange} / {formattedChangePercent}
        </div>
      </div>
      <div>
        <div className="text-muted-foreground">24h Volume</div>
        <div>{unit === "USD" ? formattedVolume : formattedAssetVolume}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Open Interest</div>
        <div>{unit === "USD" ? formattedOI : formattedAssetOI}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Funding / Countdown</div>
        <div>
          <span className={ctx.funding >= 0 ? "text-green-400" : "text-red-400"}>
            {formattedFundingRate}
          </span>{" "}/ {countdown}
        </div>
      </div>
    </div>
  );
}; 