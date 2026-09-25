"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock, Layers, RefreshCw } from "lucide-react";
import { EventCluster, EventDetail } from "@/types/news";
import { fetchNewsFeed, fetchEventDetail } from "@/lib/api";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { SummaryDetail } from "@/components/SummaryDetail";
import { MarketTicker } from "@/components/MarketTicker";

export default function Home() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [feed, setFeed] = useState<EventCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Pagination States
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Sidebar Controls
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Auth & Onboarding Protection Guard
  useEffect(() => {
    const token = localStorage.getItem("decluttered_token");
    const userRaw = localStorage.getItem("decluttered_user");

    if (!token || !userRaw) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      if (!user.onboarding_completed) {
        router.push("/onboarding");
        return;
      }
      setAuthorized(true);
    } catch (err) {
      localStorage.removeItem("decluttered_token");
      localStorage.removeItem("decluttered_user");
      router.push("/login");
    }
  }, [router]);

  const loadFeed = async (pageNumber: number = 1) => {
    if (pageNumber === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await fetchNewsFeed(pageNumber);
      const clusters = res.data || [];

      if (clusters.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (pageNumber === 1) {
        setFeed(clusters);
      } else {
        setFeed((prev) => {
          const existingIds = new Set(feed.map((item) => item.id));
          const uniqueClusters = clusters.filter((item) => !existingIds.has(item.id));
          return [...prev, ...uniqueClusters];
        });
      }
    } catch (err) {
      console.error("Feed load error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      setPage(1);
      loadFeed(1);
    }
  }, [authorized]);

  const handleRefresh = () => {
    setPage(1);
    loadFeed(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(nextPage);
  };

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

  // Filter feed based on sidebar category & search input
  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      let matchesCategory = false;

      if (selectedCategory === "ALL") {
        matchesCategory = true;
      } else if (selectedCategory === "MY_VECTORS") {
        matchesCategory = item.is_preferred === true;
      } else {
        matchesCategory = item.category.toLowerCase() === selectedCategory.toLowerCase();
      }
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.summary?.what_happened &&
          item.summary.what_happened.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [feed, selectedCategory, searchQuery]);

  // Block rendering until session verification completes
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0d0e11] flex items-center justify-center font-mono text-xs text-[#8b949e]">
        <RefreshCw className="w-4 h-4 animate-spin text-[#ff6600] mr-2" />
        Verifying session state...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e11] text-[#c9d1d9] font-mono text-sm antialiased">
      <Header loading={loading} onRefresh={handleRefresh} />

      <div className="max-w-7xl mx-auto flex">
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        >
          {/* Market Ticker inside sidebar directly */}
          <MarketTicker />
        </Sidebar>

        {/* Main Feed View */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="py-20 text-center text-[#8b949e] flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#ff6600]" />
              <span>Fetching cluster streams...</span>
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="py-20 text-center text-[#8b949e] border border-dashed border-[#21262d] rounded-lg">
              No intelligence clusters matched your filter criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeed.map((item, idx) => {
                const isExpanded = selectedEventId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg transition-all ${
                      isExpanded
                        ? "border-[#ff6600] bg-[#161b22]"
                        : "border-[#21262d] bg-[#0d0e11] hover:border-[#30363d]"
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

                      <ChevronRight
                        className={`w-5 h-5 text-[#8b949e] transition-transform ${
                          isExpanded ? "rotate-90 text-[#ff6600]" : ""
                        }`}
                      />
                    </div>

                    {isExpanded && (
                      <SummaryDetail item={item} detail={eventDetail} loading={detailLoading} />
                    )}
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {hasMore && filteredFeed.length > 0 && (
                <div className="pt-6 pb-12 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] font-medium px-6 py-2.5 rounded-lg text-xs transition-all disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#ff6600]" />
                        Loading...
                      </>
                    ) : (
                      "Load More Stories"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}