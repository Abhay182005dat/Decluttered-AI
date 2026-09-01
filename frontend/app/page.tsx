"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Clock, Layers, RefreshCw } from "lucide-react";
import { EventCluster, EventDetail } from "@/types/news";
import { fetchNewsFeed, fetchEventDetail } from "@/lib/api";
import { Header } from "@/components/Header";
import { SummaryDetail } from "@/components/SummaryDetail";

export default function Home() {
  const [feed, setFeed] = useState<EventCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await fetchNewsFeed();
      setFeed(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleSelectEvent = async (id: string) => {
    if (selectedEventId === id) {
      setSelectedEventId(null);
      setEventDetail(null);
      return;
    }
    setSelectedEventId(id);
    setDetailLoading(true);
    try {
      const data = await fetchEventDetail(id);
      setEventDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e11] text-[#c9d1d9] font-mono text-sm antialiased">
      <Header loading={loading} onRefresh={loadFeed} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="py-20 text-center text-[#8b949e] flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#ff6600]" />
            <span>Fetching cluster streams...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map((item, idx) => {
              const isExpanded = selectedEventId === item.id;
              return (
                <div
                  key={item.id}
                  className={`border rounded-lg transition-all ${
                    isExpanded ? "border-[#ff6600] bg-[#161b22]" : "border-[#21262d] bg-[#0d0e11] hover:border-[#30363d]"
                  }`}
                >
                  <div
                    onClick={() => handleSelectEvent(item.id)}
                    className="p-4 cursor-pointer flex items-start gap-3"
                  >
                    <span className="text-[#8b949e] text-xs w-6 text-right font-bold pt-0.5">
                      {idx + 1}.
                    </span>

                    <div className="flex-1 space-y-1">
                      <h2 className="text-white font-medium hover:text-[#ff6600] transition-colors text-base leading-snug">
                        {item.title}
                      </h2>

                      <div className="flex items-center gap-3 text-xs text-[#8b949e] pt-1">
                        <span className="bg-[#21262d] text-[#c9d1d9] px-2 py-0.5 rounded text-[11px] font-sans uppercase font-semibold">
                          {item.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#ff6600]" />
                          {item.article_count} {item.article_count === 1 ? "source" : "sources"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className={`w-5 h-5 text-[#8b949e] transition-transform ${isExpanded ? "rotate-90 text-[#ff6600]" : ""}`} />
                  </div>

                  {isExpanded && <SummaryDetail item={item} detail={eventDetail} loading={detailLoading} />}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}