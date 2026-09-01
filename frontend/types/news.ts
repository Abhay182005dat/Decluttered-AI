export interface Summary {
  what_happened: string;
  why_it_happened: string;
  latest_updates: string;
  why_it_matters: string;
}

export interface EventCluster {
  id: string;
  title: string;
  category: string;
  article_count: number;
  created_at: string;
  summary?: Summary;
}

export interface Article {
  id: string;
  source_name: string;
  source_url: string;
  title: string;
  content: string;
  published_at: string;
}

export interface EventDetail {
  cluster: EventCluster;
  articles: Article[];
}