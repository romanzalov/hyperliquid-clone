"use client";
import React from "react";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

interface TradingChartProps {
  symbol: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({ symbol }) => {
  return (
    <div className="h-full w-full pb-4">
      <AdvancedRealTimeChart
        theme="dark"
        symbol={symbol}
        autosize
        backgroundColor="#0F1A1F"
        toolbar_bg="#0F1A1F"
      ></AdvancedRealTimeChart>
    </div>
  );
}; 