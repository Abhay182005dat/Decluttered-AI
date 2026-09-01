"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  is_up: boolean;
}

export function MarketTicker() {
  const [data, setData] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

  const fetchMarket = async () => {
    try {
      const res = await fetch(`${API_URL}/market`);
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch market pulse data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
    // Auto refresh tickers every 30 seconds
    const interval = setInterval(fetchMarket, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pt-4 border-t border-[#21262d] space-y-2 font-mono">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase text-[#8b949e] tracking-wider block">
          Market Pulse
        </label>
        {loading && <RefreshCw className="w-3 h-3 animate-spin text-[#ff6600]" />}
      </div>

      <div className="space-y-1.5">
        {data.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center justify-between p-2 rounded bg-[#161b22] border border-[#21262d] text-xs"
          >
            <span className="text-white font-medium">{item.symbol}</span>
            <div className="flex items-center gap-2">
              <span className="text-[#8b949e]">{item.price}</span>
              <span
                className={`flex items-center text-[11px] font-bold ${
                  item.is_up ? "text-[#3fb950]" : "text-[#f85149]"
                }`}
              >
                {item.is_up ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}