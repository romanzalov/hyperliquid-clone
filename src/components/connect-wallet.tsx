"use client";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { useSignTypedData } from "wagmi";

export const ConnectWallet = () => {
  const { login, logout, user } = usePrivy();
  const { signTypedDataAsync } = useSignTypedData();

  const handleApproveAgent = async () => {
    const walletAddress = user?.wallet?.address;
    if (!walletAddress) return;
    try {
      const timestamp = Date.now();
      const time = BigInt(timestamp);
      // Prepare typed data value
      const typedValue = {
        hyperliquidChain: "Mainnet",
        signatureChainId: "0xa4b1",
        agentAddress: walletAddress,
        nonce: time,
      };
      // Sign the typed data
      const signatureHex = await signTypedDataAsync({
        domain: {
          name: "HyperliquidSignTransaction",
          version: "1",
          chainId: 42161,
          verifyingContract: "0x0000000000000000000000000000000000000000",
        },
        types: {
          "HyperliquidTransaction:ApproveAgent": [
            { name: "hyperliquidChain", type: "string" },
            { name: "signatureChainId", type: "string" },
            { name: "agentAddress", type: "string" },
            { name: "nonce", type: "uint64" },
          ],
        },
        primaryType: "HyperliquidTransaction:ApproveAgent",
        message: typedValue,
      });
      // Split the signature into r, s, v
      const r = signatureHex.slice(0, 66);
      const s = `0x${signatureHex.slice(66, 130)}`;
      const v = parseInt(signatureHex.slice(130, 132), 16);
      const payload = {
        action: {
          type: "approveAgent",
          hyperliquidChain: "Mainnet",
          signatureChainId: "0xa4b1",
          agentAddress: walletAddress,
          nonce: timestamp,
        },
        nonce: timestamp,
      };
      const body = {
        ...payload,
        signature: { r, s, v },
      };
      const res = await fetchWithRetry(
        "https://api.hyperliquid.xyz/exchange",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      console.log("ApproveAgent response", res);
      alert("Agent approved!");
    } catch (e: any) {
      console.error(e);
      alert("Failed to approve agent: " + e.message);
    }
  };

  if (!user) {
    return <Button onClick={login} size="sm">Connect</Button>;
  }

  return (
    <div className="flex items-center gap-4">
        <p className="text-sm truncate">{user.wallet?.address}</p>
        <Button onClick={logout} size="sm">Logout</Button>
        <Button onClick={handleApproveAgent} size="sm">Approve Agent</Button>
    </div>
  )
}; 