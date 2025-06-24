"use client"
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrivy } from "@privy-io/react-auth";
import { useSignTypedData } from "wagmi";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

interface OrderEntryProps {
    symbol: string;
}

export const OrderEntry: React.FC<OrderEntryProps> = ({ symbol }) => {
    const [size, setSize] = React.useState<string>("");
    const [orderSide, setOrderSide] = React.useState<"buy" | "sell">("buy");
    const [assets, setAssets] = React.useState<any[]>([]);
    const { authenticated, user } = usePrivy();
    const { signTypedDataAsync } = useSignTypedData();

    React.useEffect(() => {
        const fetchAssets = async () => {
            try {
                const meta = await fetchWithRetry("https://api.hyperliquid.xyz/info", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "meta" }),
                });
                setAssets(meta.universe);
            } catch (error) {
                console.error("Failed to fetch assets", error);
            }
        };
        fetchAssets();
    }, []);

    const handleOrder = async (side: "buy" | "sell") => {
        if (!authenticated || !user?.wallet?.address) {
            alert("Please connect your wallet first");
            return;
        }

        if (!size || parseFloat(size) <= 0) {
            alert("Please enter a valid size");
            return;
        }

        const assetIndex = assets.findIndex(a => a.name === symbol);
        if (assetIndex === -1) {
            alert("Invalid symbol");
            return;
        }

        try {
            const timestamp = Date.now();
            const orderForSigning = {
                a: assetIndex,
                b: side === "buy",
                p: "0",
                s: size,
                r: false,
                t: { limit: { tif: "Ioc" } },
            };

            const message = {
                type: "order",
                orders: [orderForSigning],
                grouping: "na",
                nonce: BigInt(timestamp),
                vaultAddress: "0x0000000000000000000000000000000000000000" as `0x${string}`,
            };
            
            const signatureHex = await signTypedDataAsync({
                domain: {
                    name: "HyperliquidSignTransaction",
                    version: "1",
                    chainId: 42161,
                    verifyingContract: "0x0000000000000000000000000000000000000000",
                },
                types: {
                    Order: [
                        { name: "a", type: "uint32" },
                        { name: "b", type: "bool" },
                        { name: "p", type: "string" },
                        { name: "s", type: "string" },
                        { name: "r", type: "bool" },
                        { name: "t", type: "Tif" },
                    ],
                    Tif: [
                        { name: "limit", type: "Limit" },
                    ],
                    Limit: [
                        { name: "tif", type: "string" },
                    ],
                    "HyperliquidTransaction:Order": [
                        { name: "type", type: "string" },
                        { name: "orders", type: "Order[]" },
                        { name: "grouping", type: "string" },
                        { name: "nonce", type: "uint64" },
                        { name: "vaultAddress", type: "address" },
                    ],
                },
                primaryType: "HyperliquidTransaction:Order",
                message: message,
                account: user.wallet.address as `0x${string}`
            });

            const r = signatureHex.slice(0, 66);
            const s = `0x${signatureHex.slice(66, 130)}`;
            const v = parseInt(signatureHex.slice(130, 132), 16);

            const orderForApi = {
                a: assetIndex,
                b: side === "buy",
                p: "0",
                s: size,
                r: false,
                t: { limit: { tif: "Ioc" } },
            };

            const body = { 
                action: {
                    type: "order",
                    grouping: "na",
                    orders: [orderForApi],
                },
                nonce: timestamp, 
                signature: { r, s, v } 
            };

            const response = await fetchWithRetry("https://api.hyperliquid.xyz/exchange", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            console.log("Order response:", response);
            alert(`Order placed: ${side.toUpperCase()} ${size} ${symbol}`);
        } catch (error: any) {
            console.error("Order error:", error);
            alert("Order failed: " + error.message);
        }
    };

    return (
        <div className="p-4 text-white h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Market Order</h3>
                <span className="text-xs text-muted-foreground">{symbol}</span>
            </div>
            
            {/* Order Side Selection */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <Button 
                    variant={orderSide === "buy" ? "default" : "outline"}
                    className={orderSide === "buy" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setOrderSide("buy")}
                >
                    Buy / Long
                </Button>
                <Button 
                    variant={orderSide === "sell" ? "default" : "outline"}
                    className={orderSide === "sell" ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => setOrderSide("sell")}
                >
                    Sell / Short
                </Button>
            </div>
            
            {/* Size Input */}
            <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1 block">
                    Size ({symbol})
                </label>
                <Input 
                    type="number"
                    placeholder="0.00"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="bg-background border-border"
                />
            </div>
            
            {/* Order Actions */}
            <div className="mt-auto space-y-2">
                <Button 
                    onClick={() => handleOrder(orderSide)}
                    disabled={!authenticated || !size}
                    className={`w-full ${
                        orderSide === "buy" 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                    {authenticated 
                        ? `${orderSide === "buy" ? "Buy" : "Sell"} ${symbol}`
                        : "Connect Wallet"
                    }
                </Button>
                
                {authenticated && (
                    <div className="text-xs text-muted-foreground text-center">
                        Wallet: {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                    </div>
                )}
            </div>
        </div>
    )
} 