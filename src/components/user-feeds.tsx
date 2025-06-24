"use client"
import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWebSocket } from '@/lib/useWebSocket';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const UserFeeds = () => {
    const { authenticated, user } = usePrivy();
    const [userState, setUserState] = useState<any>(null);
    const [hasReceivedData, setHasReceivedData] = useState(false);
    const walletAddress = user?.wallet?.address;

    const subscriptions = React.useMemo(() => {
        if (!walletAddress) return [];
        return [{
            type: 'userEvents',
            user: walletAddress,
        }];
    }, [walletAddress]);

    const { lastMessage } = useWebSocket(
        'wss://api.hyperliquid.xyz/ws',
        subscriptions
    );

    useEffect(() => {
        if (lastMessage !== null) {
            setHasReceivedData(true);
            const data = JSON.parse(lastMessage.data);
            if (data.channel === 'userEvents' && data.data) {
                setUserState(data.data);
            }
        }
    }, [lastMessage]);

    if (!authenticated || !walletAddress) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Connect wallet to see user data</p>
            </div>
        );
    }
    
    if (!hasReceivedData) {
        return (
            <div className="p-4 text-white h-full flex flex-col">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Loading user data...</p>
                </div>
            </div>
        );
    }
    
    const { assetPositions = [], crossMarginSummary } = userState || {};
    const activePositions = assetPositions.filter((p: any) => parseFloat(p.position.szi) !== 0);

    return (
        <div className="p-4 text-white h-full flex flex-col">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div className="bg-background/50 p-3 rounded-md">
                    <div className="text-muted-foreground text-xs">Account Value</div>
                    <div className="font-mono text-lg">${parseFloat(crossMarginSummary?.accountValue || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-background/50 p-3 rounded-md">
                    <div className="text-muted-foreground text-xs">Total Margin Used</div>
                    <div className="font-mono text-lg">${parseFloat(crossMarginSummary?.totalMarginUsed || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-background/50 p-3 rounded-md">
                    <div className="text-muted-foreground text-xs">Total Position Value</div>
                    <div className="font-mono text-lg">${parseFloat(crossMarginSummary?.totalNtlPos || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-background/50 p-3 rounded-md">
                    <div className="text-muted-foreground text-xs">Total Raw USD</div>
                    <div className="font-mono text-lg">${parseFloat(crossMarginSummary?.totalRawUsd || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
            </div>

            <Tabs defaultValue="positions" className="flex-grow flex flex-col">
                <TabsList className="w-full">
                    <TabsTrigger value="positions" className="flex-1">Positions ({activePositions.length})</TabsTrigger>
                    <TabsTrigger value="orders" className="flex-1">Open Orders (0)</TabsTrigger>
                    <TabsTrigger value="fills" className="flex-1">Fills (0)</TabsTrigger>
                </TabsList>
                <TabsContent value="positions" className="flex-grow overflow-y-auto">
                    {activePositions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Entry Price</TableHead>
                                    <TableHead>Liq. Price</TableHead>
                                    <TableHead>Unrealized PnL</TableHead>
                                    <TableHead>Margin Used</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activePositions.map((pos: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{pos.position.coin}</TableCell>
                                        <TableCell>{parseFloat(pos.position.szi).toLocaleString()}</TableCell>
                                        <TableCell>${parseFloat(pos.position.entryPx).toLocaleString()}</TableCell>
                                        <TableCell className="text-orange-400">${pos.position.liquidationPx ? parseFloat(pos.position.liquidationPx).toLocaleString() : 'N/A'}</TableCell>
                                        <TableCell className={parseFloat(pos.position.unrealizedPnl) >= 0 ? 'text-green-500' : 'text-red-500'}>
                                            {parseFloat(pos.position.unrealizedPnl).toFixed(2)}
                                        </TableCell>
                                        <TableCell>${parseFloat(pos.position.marginUsed).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>No open positions</p>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="orders">
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No open orders</p>
                    </div>
                </TabsContent>
                <TabsContent value="fills">
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No fills</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}; 