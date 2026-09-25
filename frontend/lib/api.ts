import { EventDetail, FeedResponse } from "@/types/news";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export async function fetchNewsFeed(page: number = 1): Promise<FeedResponse> {
  const token = typeof window !== "undefined" ? localStorage.getItem("decluttered_token") : null;
  const headers: HeadersInit = {"Content-type": "application/json"};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/feed?page=${page}`, { headers, cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch news feed");

  if(!res.ok) {
    throw new Error(`Failed to fetch news feed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchEventDetail(id: string): Promise<EventDetail | null> {
  const res = await fetch(`${API_URL}/events/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch event details");
  const data = await res.json();
  return data.data || null;
}