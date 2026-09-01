import { Sparkles, Terminal, Clock, Flame, ExternalLink, RefreshCw } from "lucide-react";
import { EventCluster, EventDetail } from "@/types/news";

interface SummaryDetailProps {
  item: EventCluster;
  detail: EventDetail | null;
  loading: boolean;
}

export function SummaryDetail({ item, detail, loading }: SummaryDetailProps) {
  if (loading) {
    return (
      <div className="py-6 text-center text-[#8b949e] flex items-center justify-center gap-2 font-mono text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-[#ff6600]" />
        Fetching intelligence record...
      </div>
    );
  }

  return (
    <div className="border-t border-[#21262d] p-5 bg-[#010409] space-y-5 rounded-b-lg">
      {item.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-sm">
          <div className="bg-[#161b22] p-3.5 rounded border border-[#30363d] space-y-1">
            <span className="text-[#ff6600] font-mono text-xs uppercase font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> What Happened
            </span>
            <p className="text-[#c9d1d9] leading-relaxed text-xs">{item.summary.what_happened}</p>
          </div>

          <div className="bg-[#161b22] p-3.5 rounded border border-[#30363d] space-y-1">
            <span className="text-[#58a6ff] font-mono text-xs uppercase font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Why It Happened
            </span>
            <p className="text-[#c9d1d9] leading-relaxed text-xs">{item.summary.why_it_happened}</p>
          </div>

          <div className="bg-[#161b22] p-3.5 rounded border border-[#30363d] space-y-1">
            <span className="text-[#3fb950] font-mono text-xs uppercase font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Latest Updates
            </span>
            <p className="text-[#c9d1d9] leading-relaxed text-xs">{item.summary.latest_updates}</p>
          </div>

          <div className="bg-[#161b22] p-3.5 rounded border border-[#30363d] space-y-1">
            <span className="text-[#d2a8ff] font-mono text-xs uppercase font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> Why It Matters
            </span>
            <p className="text-[#c9d1d9] leading-relaxed text-xs">{item.summary.why_it_matters}</p>
          </div>
        </div>
      )}

      {detail?.articles && detail.articles.length > 0 && (
        <div className="pt-2">
          <span className="text-xs text-[#8b949e] font-bold uppercase tracking-wider block mb-2 font-mono">
            Ingested Source Coverage ({detail.articles.length})
          </span>
          <div className="space-y-2">
            {detail.articles.map((art) => (
              <a
                key={art.id}
                href={art.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 bg-[#161b22] hover:bg-[#21262d] rounded border border-[#30363d] group transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="text-white text-xs group-hover:text-[#ff6600] transition-colors font-medium">
                    {art.title}
                  </span>
                  <span className="text-[11px] text-[#8b949e] block font-mono">
                    Source: {art.source_name}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-[#8b949e] group-hover:text-[#ff6600] shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}