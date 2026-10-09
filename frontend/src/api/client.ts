import axios from "axios";
import type { IContent, ITag, ContentType } from "../types";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith("/share")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/signin") && !window.location.pathname.includes("/signup")) {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

// Content APIs
export const fetchContentList = async (params?: {
  type?: string;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.get<{ content: IContent[]; total: number }>(
    "/content",
    { params }
  );
  return res.data;
};

export const createContentApi = async (data: {
  title: string;
  type: ContentType;
  link?: string;
  description?: string;
  tags?: string[];
}) => {
  const res = await api.post<{ message: string; content: IContent }>(
    "/content",
    data
  );
  return res.data;
};

export const updateContentApi = async (
  id: string,
  data: {
    title?: string;
    type?: ContentType;
    link?: string;
    description?: string;
    tags?: string[];
  }
) => {
  const res = await api.patch<{ message: string; content: IContent }>(
    `/content/${id}`,
    data
  );
  return res.data;
};

export const deleteContentApi = async (id: string) => {
  const res = await api.delete<{ message: string }>(`/content/${id}`);
  return res.data;
};

// Tag APIs
export const fetchTagsApi = async () => {
  const res = await api.get<{ tags: ITag[] }>("/tags");
  return res.data.tags;
};

// Brain Share APIs
export const getShareLinkApi = async () => {
  const res = await api.post<{ hash: string; message: string }>("/brain/share", {
    share: true,
  });
  return res.data;
};

export const revokeShareLinkApi = async () => {
  const res = await api.delete<{ message: string }>("/brain/share");
  return res.data;
};

export const fetchSharedBrainApi = async (shareLink: string) => {
  const res = await api.get<{ username: string; content: IContent[] }>(
    `/brain/${shareLink}`
  );
  return res.data;
};

// AI Intelligence APIs
export interface AiSearchResultItem {
  tweet_id: string;
  text: string;
  author: string;
  topic: string;
  subtopic: string;
  similarity_score: number;
  tags: string[];
}

export interface AiRecommendationItem {
  tweet_id: string;
  text: string;
  author: string;
  topic: string;
  similarity_score: number;
  explanation: string;
}

export interface AiConnectionData {
  tweet_1: any;
  tweet_2: any;
  relationship_type: string;
  confidence: number;
  explanation: string;
  evidence: string[];
}

export interface AiDigestData {
  topic: string;
  tweet_count: number;
  summary: string;
  recurring_themes: string[];
  knowledge_gaps: string[];
  suggested_explorations: string[];
  cited_tweet_ids: string[];
}

export const fetchAiSemanticSearch = async (query: string, topic?: string, limit?: number) => {
  const res = await api.post<{ query: string; total_found: number; results: AiSearchResultItem[] }>(
    "/ai/search",
    { query, topic, limit }
  );
  return res.data;
};

export const fetchAiRecommendations = async (source_tweet_id?: string, source_text?: string, limit?: number) => {
  const res = await api.post<{ source_context: string; recommendations: AiRecommendationItem[] }>(
    "/ai/recommendations",
    { source_tweet_id, source_text, limit }
  );
  return res.data;
};

export const fetchAiConnections = async (tweet_id_1: string, tweet_id_2: string) => {
  const res = await api.post<AiConnectionData>(
    "/ai/connections",
    { tweet_id_1, tweet_id_2 }
  );
  return res.data;
};

export const fetchAiDigest = async (topic?: string, period_days?: number, max_tweets?: number) => {
  const res = await api.post<AiDigestData>(
    "/ai/digest",
    { topic, period_days, max_tweets }
  );
  return res.data;
};

export const fetchAiHealth = async () => {
  const res = await api.get<{ status: string; total_loaded_tweets: number }>("/ai/health");
  return res.data;
};
