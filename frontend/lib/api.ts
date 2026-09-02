import { EventCluster, EventDetail } from "@/types/news";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export async function fetchNewsFeed(): Promise<EventCluster[]> {
  const res = await fetch(`${API_URL}/feed`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch news feed");
  const data = await res.json();
  return data.data || [];
}

export async function fetchEventDetail(id: string): Promise<EventDetail | null> {
  const res = await fetch(`${API_URL}/events/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch event details");
  const data = await res.json();
  return data.data || null;
}