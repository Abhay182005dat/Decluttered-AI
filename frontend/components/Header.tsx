"use client";

import { RefreshCw, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";

interface HeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export function Header({ loading, onRefresh }: HeaderProps) {
  return (
    <header className="border-b border-[#21262d] bg-[#161b22]/80 backdrop-blur sticky top-0 z-50 font-mono">
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="bg-[#ff6600] text-black px-2 py-1 rounded font-bold text-xs tracking-tighter">
            D//
          </div>
          <span className="font-bold text-white tracking-tight text-sm sm:text-base truncate">
            DECLUTTERED
          </span>
          <span className="text-[#8b949e] text-xs hidden sm:inline">
            | High-Signal News Intelligence
          </span>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            className="flex min-h-11 items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#ff6600] transition-colors bg-[#21262d] px-2.5 sm:px-3 rounded border border-[#30363d]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loading ? "animate-spin text-[#ff6600]" : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Edit Interests Button */}
          <Link
            href="/onboarding"
            className="flex min-h-11 items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#ff6600] transition-colors bg-[#21262d] border border-[#30363d] px-2.5 sm:px-3 rounded"
            title="Modify News Preferences"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff6600]" />
            <span className="hidden sm:inline">Preferences</span>
          </Link>

          {/* Active User Avatar & Auth State */}
          <div className="pl-1 sm:pl-2 border-l border-[#21262d]">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}