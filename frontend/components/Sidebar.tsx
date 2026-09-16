"use client";

import { Search, Compass, Zap, Cpu, TrendingUp, ShieldAlert, Globe, Sparkles } from "lucide-react";

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  children?: React.ReactNode;
}

const CATEGORIES = [
  { id: "ALL", label: "All Intelligence", icon: Compass },
  { id: "MY_VECTORS", label: "My Preferred Feed", icon: Sparkles },
  { id: "technology", label: "Technology", icon: Zap },
  { id: "ai", label: "Artificial Intelligence", icon: Cpu },
  { id: "markets", label: "Markets & Finance", icon: TrendingUp },
  { id: "cybersecurity", label: "Cybersecurity", icon: ShieldAlert },
  { id: "climate", label: "Climate & Energy", icon: Globe },
];

export function Sidebar({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  children,
}: SidebarProps) {
  return (
    <aside className="w-64 border-r border-[#21262d] p-4 flex flex-col gap-6 font-mono text-xs select-none">
      {/* Search Bar */}
      <div>
        <label className="block text-[10px] font-bold text-[#8b949e] uppercase tracking-wider mb-2">
          Search Feed
        </label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Filter by keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#161b22] border border-[#21262d] focus:border-[#ff6600] outline-none text-[#c9d1d9] pl-8 pr-3 py-2 rounded text-xs"
          />
        </div>
      </div>

      {/* Dynamic Stream Categories */}
      <div>
        <label className="block text-[10px] font-bold text-[#8b949e] uppercase tracking-wider mb-2">
          Streams
        </label>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors ${
                  isSelected
                    ? "bg-[#ff6600]/10 text-[#ff6600] font-bold border border-[#ff6600]/30"
                    : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </div>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#ff6600]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Market Ticker Slot */}
      {children}
    </aside>
  );
}