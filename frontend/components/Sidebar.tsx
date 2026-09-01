"use client";

import { 
  Globe, 
  Cpu, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  Search
} from "lucide-react";
import { MarketTicker } from "@/components/MarketTicker"; // <-- Import

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const CATEGORIES = [
  { id: "ALL", label: "All Intelligence", icon: Globe },
  { id: "Technology", label: "Technology", icon: Cpu },
  { id: "Business", label: "Business & Markets", icon: TrendingUp },
  { id: "Cybersecurity", label: "Cybersecurity", icon: ShieldAlert },
  { id: "AI", label: "Artificial Intelligence", icon: Zap },
];

export function Sidebar({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-[#21262d] bg-[#0d0e11] min-h-[calc(100vh-3.5rem)] p-4 space-y-6 hidden md:block sticky top-14 self-start">
      {/* Quick Search */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono font-bold uppercase text-[#8b949e] tracking-wider block">
          Search Feed
        </label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Filter by keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#ff6600] rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8b949e] outline-none font-mono transition-colors"
          />
        </div>
      </div>

      {/* Category Navigation */}
      <div className="space-y-1">
        <label className="text-[11px] font-mono font-bold uppercase text-[#8b949e] tracking-wider block px-1 mb-2">
          Streams
        </label>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition-colors ${
                isActive
                  ? "bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600]/30 font-bold"
                  : "text-[#c9d1d9] hover:bg-[#161b22] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-[#ff6600]" : "text-[#8b949e]"}`} />
                <span>{cat.label}</span>
              </div>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600]" />}
            </button>
          );
        })}
      </div>

      {/* Embedded Market Ticker */}
      <MarketTicker />
    </aside>
  );
}