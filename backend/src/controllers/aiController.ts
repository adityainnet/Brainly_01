import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AI_SERVICE_URL } from "../config";
import { ContentModel } from "../models";

async function fetchAiService(endpoint: string, options: RequestInit = {}) {
  const url = `${AI_SERVICE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI service error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Syncs any un-indexed tweets from MongoDB to the AI service for this user.
 */
async function syncUserTweets(userId: string) {
  try {
    const dbTweets = await ContentModel.find({
      userId,
      type: { $in: ["tweet", "text", "document"] },
    }).populate("tags", "name");

    for (const tw of dbTweets) {
      const tagStr = (tw.tags || []).map((t: any) => t.name || t).join(";");
      await fetchAiService("/api/v1/sync", {
        method: "POST",
        body: JSON.stringify({
          tweet_id: tw._id.toString(),
          user_id: userId,
          text: tw.description ? `${tw.title} - ${tw.description}` : tw.title,
          author: "@user",
          topic: tw.type === "tweet" ? "Saved Tweets" : "Notes",
          subtopic: "Personal Brain",
          created_at: tw.createdAt.toISOString(),
          source_type: tw.type,
          tags: tagStr,
        }),
      });
    }
  } catch (err) {
    // Non-blocking sync failure
    console.warn("Background AI sync warning:", err);
  }
}

export const semanticSearch = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { query, topic, limit } = req.body;

  if (!query || typeof query !== "string") {
    res.status(400).json({ message: "Search query string is required" });
    return;
  }

  try {
    // Optionally trigger background sync
    void syncUserTweets(req.userId!);

    const data = await fetchAiService("/api/v1/search", {
      method: "POST",
      body: JSON.stringify({
        user_id: req.userId,
        query,
        topic: topic || undefined,
        limit: limit || 10,
      }),
    });

    res.status(200).json(data);
  } catch (error: any) {
    console.error("AI Semantic Search failed:", error.message);
    res.status(503).json({
      message: "AI Intelligence Service is temporarily unavailable.",
      error: error.message,
    });
  }
};

export const getRecommendations = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { source_tweet_id, source_text, limit } = req.body;

  try {
    void syncUserTweets(req.userId!);

    const data = await fetchAiService("/api/v1/recommendations", {
      method: "POST",
      body: JSON.stringify({
        user_id: req.userId,
        source_tweet_id: source_tweet_id || undefined,
        source_text: source_text || undefined,
        limit: limit || 5,
      }),
    });

    res.status(200).json(data);
  } catch (error: any) {
    console.error("AI Recommendations failed:", error.message);
    res.status(503).json({
      message: "AI Intelligence Service is temporarily unavailable.",
      error: error.message,
    });
  }
};

export const getConnections = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { tweet_id_1, tweet_id_2 } = req.body;

  if (!tweet_id_1 || !tweet_id_2) {
    res.status(400).json({ message: "Both tweet_id_1 and tweet_id_2 are required" });
    return;
  }

  try {
    const data = await fetchAiService("/api/v1/connections", {
      method: "POST",
      body: JSON.stringify({
        user_id: req.userId,
        tweet_id_1,
        tweet_id_2,
      }),
    });

    res.status(200).json(data);
  } catch (error: any) {
    console.error("AI Connections failed:", error.message);
    res.status(503).json({
      message: "AI Intelligence Service is temporarily unavailable.",
      error: error.message,
    });
  }
};

export const getDigest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { topic, period_days, max_tweets } = req.body;

  try {
    void syncUserTweets(req.userId!);

    const data = await fetchAiService("/api/v1/digest", {
      method: "POST",
      body: JSON.stringify({
        user_id: req.userId,
        topic: topic || undefined,
        period_days: period_days || 90,
        max_tweets: max_tweets || 20,
      }),
    });

    res.status(200).json(data);
  } catch (error: any) {
    console.error("AI Digest failed:", error.message);
    res.status(503).json({
      message: "AI Intelligence Service is temporarily unavailable.",
      error: error.message,
    });
  }
};

export const getAiHealth = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const data = await fetchAiService("/health");
    res.status(200).json(data);
  } catch (error: any) {
    res.status(503).json({
      status: "offline",
      message: "AI Service is not reachable on " + AI_SERVICE_URL,
    });
  }
};
