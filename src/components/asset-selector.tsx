"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Asset {
  name: string;
  szDecimals: number;
}

interface AssetSelectorProps {
    selectedAsset: string;
    setSelectedAsset: (asset: string) => void;
}

export function AssetSelector({selectedAsset, setSelectedAsset}: AssetSelectorProps) {
  const [assets, setAssets] = React.useState<Asset[]>([]);

  React.useEffect(() => {
    async function fetchAssets() {
      try {
        const response = await fetch("https://api.hyperliquid.xyz/info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: "meta" }),
        });
        const data = await response.json();
        if (data && data.universe) {
          setAssets(data.universe);
        }
      } catch (error) {
        console.error("Error fetching assets:", error);
      }
    }

    fetchAssets();
  }, []);

  // Sort assets alphabetically and enable search
  const sortedAssets = React.useMemo(
    () => [...assets].sort((a, b) => a.name.localeCompare(b.name)),
    [assets]
  );
  const [search, setSearch] = React.useState<string>("");
  const filteredAssets = sortedAssets.filter((asset) =>
    asset.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Select onValueChange={setSelectedAsset} value={selectedAsset}>
      <SelectTrigger size="sm" className="h-6 w-fit min-w-[100px]">
        <SelectValue placeholder="Select an asset" />
      </SelectTrigger>
      <SelectContent>
        {/* Search input */}
        <div className="p-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>
        <SelectGroup>
          <SelectLabel>Assets</SelectLabel>
          {filteredAssets.map((asset) => (
            <SelectItem key={asset.name} value={asset.name}>
              {`${asset.name}-USD`}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
} 