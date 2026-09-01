import { RefreshCw } from "lucide-react";

interface HeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export function Header({ loading, onRefresh }: HeaderProps) {
  return (
    <header className="border-b border-[#21262d] bg-[#161b22]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#ff6600] text-black px-2 py-1 rounded font-bold text-xs tracking-tighter">
            D//
          </div>
          <span className="font-bold text-white tracking-tight text-base font-mono">DECLUTTERED</span>
          <span className="text-[#8b949e] text-xs hidden sm:inline font-mono">| High-Signal News Intelligence</span>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#ff6600] transition-colors bg-[#21262d] px-2.5 py-1.5 rounded font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#ff6600]" : ""}`} />
          Refresh
        </button>
      </div>
    </header>
  );
}