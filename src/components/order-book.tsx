"use client"
import * as React from "react";
import { MoreVertical } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useWebSocket } from "@/lib/useWebSocket";

interface OrderLevel {
    px: string;
    sz: string;
}

interface Trade {
    px: string;
    sz: string;
    side: string;
    time: number;
}

interface OrderBookProps {
    symbol: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ symbol }) => {
    const [bids, setBids] = React.useState<OrderLevel[]>([]);
    const [asks, setAsks] = React.useState<OrderLevel[]>([]);
    const [spread, setSpread] = React.useState<number>(0);
    const [trades, setTrades] = React.useState<Trade[]>([]);
    const [activeTab, setActiveTab] = React.useState<"orderbook"|"trades">("orderbook");
    const [resolution, setResolution] = React.useState<string>("1");
    const [unit, setUnit] = React.useState<string>(symbol);
    const resolutionOptions = ["1", "2", "5", "10", "100", "1000"];

    const subscribeMessages = React.useMemo(() => [
        { method: "subscribe", subscription: { type: "l2Book", coin: symbol } },
        { method: "subscribe", subscription: { type: "trades", coin: symbol } },
    ], [symbol]);

    const { lastMessage } = useWebSocket(
      'wss://api.hyperliquid.xyz/ws',
      subscribeMessages
    );

    React.useEffect(() => {
        if (!lastMessage) return;
        try {
            const data = JSON.parse(lastMessage.data);
            
            if (data.channel === "l2Book" && data.data) {
                const { levels } = data.data;
                if (levels && levels.length >= 2) {
                    const rawBids = levels[0] || [];
                    const rawAsks = levels[1] || [];

                    const res = parseFloat(resolution);
                    const groupLevels = (arr: OrderLevel[], isBid: boolean) => {
                        const map = new Map<number, number>();
                        arr.forEach(({ px, sz }) => {
                            const price = parseFloat(px);
                            const bin = Math.floor(price / res) * res;
                            const size = parseFloat(sz);
                            map.set(bin, (map.get(bin) || 0) + size);
                        });
                        const grouped = Array.from(map.entries()).map(([price, size]) => ({ px: price.toString(), sz: size.toString() }));
                        return grouped.sort((a, b) => isBid
                            ? parseFloat(b.px) - parseFloat(a.px)
                            : parseFloat(a.px) - parseFloat(b.px)
                        );
                    };

                    const groupedBids = groupLevels(rawBids, true).slice(0, 20);
                    const groupedAsks = groupLevels(rawAsks, false).slice(0, 20);

                    setBids(groupedBids);
                    setAsks(groupedAsks);

                    if (groupedAsks.length > 0 && groupedBids.length > 0) {
                        const bestAsk = parseFloat(groupedAsks[0].px);
                        const bestBid = parseFloat(groupedBids[0].px);
                        setSpread(bestAsk - bestBid);
                    }
                }
            }
            
            if (data.channel === "trades" && data.data) {
                let newTrades: Trade[];
                if (Array.isArray(data.data)) {
                    newTrades = data.data;
                } else if (data.data.trades) {
                    newTrades = data.data.trades;
                } else {
                    newTrades = [data.data];
                }
                
                setTrades(prev => [...newTrades, ...prev].slice(0, 50));
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    }, [lastMessage, resolution]);

    React.useEffect(() => {
        setUnit(symbol);
    }, [symbol]);

    const formatPrice = (price: number) => {
        return price.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 4 
        });
    };

    const formatSize = (size: number) => {
        return size.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 6 
        });
    };

    const renderOrderBookRows = (orders: OrderLevel[], isBid: boolean) => {
        if (!orders || orders.length === 0) return null;

        let cumulativeAsset = 0;
        let cumulativeUSD = 0;
        const maxCumulativeAsset = orders.reduce((acc, order) => acc + parseFloat(order.sz), 0);
        const maxCumulativeUSD = orders.reduce(
            (acc, order) => acc + parseFloat(order.px) * parseFloat(order.sz),
            0
        );

        const rows = orders.map((order, index) => {
            const price = parseFloat(order.px);
            const size = parseFloat(order.sz);
            const sizeUSD = price * size;
            cumulativeAsset += size;
            cumulativeUSD += sizeUSD;
            const depth = unit === "USD"
                ? maxCumulativeUSD > 0 ? (cumulativeUSD / maxCumulativeUSD) * 100 : 0
                : maxCumulativeAsset > 0 ? (cumulativeAsset / maxCumulativeAsset) * 100 : 0;

            const displaySize = unit === "USD" ? formatPrice(sizeUSD) : formatSize(size);
            const displayCumul = unit === "USD" ? formatPrice(cumulativeUSD) : formatSize(cumulativeAsset);

            return (
                <div key={`${price}-${index}`} className="flex justify-between relative h-5 items-center text-xs hover:bg-white/5">
                    <div
                        className={`absolute top-0 h-full left-0 transition-all duration-200 ${
                            isBid ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}
                        style={{ width: `${depth}%` }}
                    />
                    <span className={`z-10 font-mono ${isBid ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPrice(price)}
                    </span>
                    <span className="z-10 font-mono text-right">
                        {displaySize}
                    </span>
                    <span className="z-10 font-mono text-right text-muted-foreground">
                        {displayCumul}
                    </span>
                </div>
            );
        });

        // For asks, reverse to show lowest prices at bottom (closest to spread)
        return isBid ? rows : rows.reverse();
    };

    return (
        <div className="p-4 text-white h-full flex flex-col">
            {/* Header Tabs */}
            <div className="flex items-center justify-between text-sm font-medium border-b border-border pb-2 mb-2">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setActiveTab("orderbook")}
                        className={activeTab === "orderbook" ? "border-b-2 border-primary pb-1" : "text-muted-foreground pb-1"}
                    >
                        Order Book
                    </button>
                    <button
                        onClick={() => setActiveTab("trades")}
                        className={activeTab === "trades" ? "border-b-2 border-primary pb-1" : "text-muted-foreground pb-1"}
                    >
                        Trades
                    </button>
                </div>
                <MoreVertical className="text-muted-foreground" size={16} />
            </div>
            
            {/* Controls: Resolution and Symbol */}
            <div className="flex items-center justify-between text-xs mb-2">
                <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger size="sm" className="h-6 w-fit min-w-[40px]">
                        <SelectValue placeholder="Res" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Resolution</SelectLabel>
                            {resolutionOptions.map((r) => (
                                <SelectItem key={r} value={r}>
                                    {r}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger size="sm" className="h-6 w-fit min-w-[100px]">
                        <SelectValue placeholder={symbol} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Unit</SelectLabel>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value={symbol}>{symbol}</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            
            {/* Column Headers */}
            <div className="flex justify-between text-xs text-gray-400 flex-shrink-0 mb-1">
                {activeTab === "orderbook" ? (
                    <>
                        <span>Price (USD)</span>
                        <span>Size ({unit})</span>
                        <span>Total ({unit})</span>
                    </>
                ) : (
                    <>
                        <span>Price</span>
                        <span>Size ({symbol})</span>
                        <span>Time</span>
                    </>
                )}
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto flex-grow mt-1 font-mono pr-2 custom-scrollbar">
                {activeTab === "orderbook" ? (
                    <>
                        {/* Asks (sells) - displayed in reverse order with highest prices at top */}
                        <div className="mb-2">
                            {renderOrderBookRows(asks, false)}
                        </div>
                        
                        {/* Spread */}
                        <div className="flex justify-between items-center text-sm font-semibold my-3 py-1 bg-white/5 px-2 rounded">
                            <span className="text-xs">Spread</span>
                            <span className="font-mono">{formatPrice(spread)}</span>
                            <span className="text-xs">
                                {asks.length > 0 && spread > 0
                                    ? `${((spread / parseFloat(asks[0].px)) * 100).toFixed(3)}%`
                                    : ""}
                            </span>
                        </div>
                        
                        {/* Bids (buys) - displayed in normal order with highest prices at top */}
                        <div className="mt-2">
                            {renderOrderBookRows(bids, true)}
                        </div>
                    </>
                ) : (
                    <div className="space-y-1">
                        {trades.map((trade, index) => {
                            const price = parseFloat(trade.px);
                            const size = parseFloat(trade.sz);
                            const timestamp = typeof trade.time === "number" 
                                ? trade.time 
                                : new Date(trade.time).getTime();
                            const timeStr = new Date(timestamp).toLocaleTimeString(undefined, {
                                hour12: false,
                            });
                            
                            return (
                                <div key={`${trade.time}-${index}`} className="flex justify-between items-center h-5 text-xs hover:bg-white/5">
                                    <span className={`font-mono ${trade.side === "buy" ? "text-green-400" : "text-red-400"}`}>
                                        {formatPrice(price)}
                                    </span>
                                    <span className="font-mono">{formatSize(size)}</span>
                                    <span className="text-muted-foreground text-xs">{timeStr}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* Custom scrollbar styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }
            `}</style>
        </div>
    );
}; 