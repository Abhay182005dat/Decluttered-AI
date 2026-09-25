"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import { MeteorBackground } from "@/components/MeteorBackground";
import { Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { SpaceWarpBackground } from "@/components/SpaceWarpBackground";

const AVAILABLE_TOPICS = [
  { id: "technology", label: "Technology", icon: "⚡" },
  { id: "ai", label: "Artificial Intelligence", icon: "🤖" },
  { id: "markets", label: "Markets & Finance", icon: "📈" },
  { id: "politics", label: "Global Politics", icon: "🌐" },
  { id: "science", label: "Science & Space", icon: "🚀" },
  { id: "crypto", label: "Web3 & Crypto", icon: "⛓️" },
  { id: "business", label: "Business & Startups", icon: "💼" },
  { id: "climate", label: "Climate & Energy", icon: "🌱" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

  // Pre-populate previously saved interests from localStorage
  useEffect(() => {
    const token = localStorage.getItem("decluttered_token");
    const userRaw = localStorage.getItem("decluttered_user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (Array.isArray(user.interests) && user.interests.length > 0) {
          setSelectedTopics(user.interests);
        }
      } catch (e) {
        console.error("Failed to parse local user profile", e);
      }
    }
  }, [router]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedTopics.length === 0) {
      setError("Please select at least one interest topic to personalize your feed.");
      return;
    }

    setLoading(true);
    setError("");

    const token = localStorage.getItem("decluttered_token");

    try {
      const res = await fetch(`${API_URL}/user/interests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interests: selectedTopics }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update preferences");

      if (data.status === "success" || res.ok) {
        // Update user state in localStorage immediately
        localStorage.setItem("decluttered_user", JSON.stringify(data.user));
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen max-w-full flex items-center justify-center p-3 sm:p-4 font-mono select-none overflow-hidden">
      <SpaceWarpBackground />

      <div className="relative z-10 w-full max-w-md sm:max-w-xl bg-[#161b22]/90 backdrop-blur-md border border-[#21262d] rounded-2xl p-4 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#ff6600]/10 border border-[#ff6600]/30 text-[#ff6600] px-3 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> PERSONALIZATION PIPELINE
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
            Select Your Signal Vectors
          </h1>
          <p className="text-xs text-[#8b949e] max-w-md mx-auto">
            Choose topics to construct your custom news intelligence stream. You can modify these anytime.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {AVAILABLE_TOPICS.map((topic) => {
            const isSelected = selectedTopics.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic.id)}
                className={`flex min-h-11 items-center justify-between p-3.5 rounded-xl border text-left text-xs transition-all ${
                  isSelected
                    ? "border-[#ff6600] bg-[#ff6600]/10 text-white"
                    : "border-[#21262d] bg-[#0d1117] text-[#8b949e] hover:border-[#30363d] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{topic.icon}</span>
                  <span className="font-medium">{topic.label}</span>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-[#ff6600] text-black flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-[#21262d] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-[#8b949e]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ff6600]" />
            <span>{selectedTopics.length} selected</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex min-h-11 items-center gap-2 bg-[#ff6600] hover:bg-[#e65c00] text-black font-bold px-5 py-2.5 rounded-lg text-xs transition-transform active:scale-[0.98] shadow-lg shadow-orange-600/20"
          >
            <span>{loading ? "Saving..." : "Build Intelligence Feed"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}