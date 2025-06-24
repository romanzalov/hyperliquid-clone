import { http } from "wagmi";
import { arbitrum } from "viem/chains";
import { createConfig } from "@privy-io/wagmi";

export const wagmiConfig = createConfig({
  chains: [arbitrum],
  transports: {
    [arbitrum.id]: http(),
  },
}); 