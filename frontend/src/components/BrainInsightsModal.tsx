import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Compass,
  GitCompare,
  BookOpen,
  Search,
  Brain,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import {
  fetchAiRecommendations,
  fetchAiConnections,
  fetchAiDigest,
  fetchAiSemanticSearch,
} from "../api/client";
import type {
  AiRecommendationItem,
  AiSearchResultItem,
  AiDigestData,
  AiConnectionData,
} from "../api/client";
import type { IContent } from "../types";

interface BrainInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedContent: IContent[];
}

export const BrainInsightsModal: React.FC<BrainInsightsModalProps> = ({
  isOpen,
  onClose,
  savedContent,
}) => {
  const [activeTab, setActiveTab] = useState<
    "recommendations" | "connections" | "digest" | "search"
  >("recommendations");

  // Tab 1: Recommendations State
  const [recommendations, setRecommendations] = useState<AiRecommendationItem[]>([]);
  const [selectedSeedId, setSelectedSeedId] = useState<string>("");
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Tab 2: Connections State
  const [connectionTweet1, setConnectionTweet1] = useState<string>("");
  const [connectionTweet2, setConnectionTweet2] = useState<string>("");
  const [connectionResult, setConnectionResult] = useState<AiConnectionData | null>(null);
  const [connLoading, setConnLoading] = useState<boolean>(false);
  const [connError, setConnError] = useState<string | null>(null);

  // Tab 3: Digest State
  const [digestTopic, setDigestTopic] = useState<string>("All");
  const [digestPeriod, setDigestPeriod] = useState<number>(90);
  const [digestData, setDigestData] = useState<AiDigestData | null>(null);
  const [digestLoading, setDigestLoading] = useState<boolean>(false);
  const [digestError, setDigestError] = useState<string | null>(null);

  // Tab 4: Semantic Search State
  const [aiSearchQuery, setAiSearchQuery] = useState<string>("");
  const [aiSearchResults, setAiSearchResults] = useState<AiSearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === "recommendations" && recommendations.length === 0) {
        void loadRecommendations();
      } else if (activeTab === "digest" && !digestData) {
        void loadDigest();
      }
    }
  }, [isOpen, activeTab]);

  const loadRecommendations = async (seedId?: string) => {
    setRecLoading(true);
    setRecError(null);
    try {
      const data = await fetchAiRecommendations(seedId || selectedSeedId || undefined);
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      setRecError("AI Service is loading or offline. Please ensure python ai-service is running.");
    } finally {
      setRecLoading(false);
    }
  };

  const handleExplainConnection = async () => {
    if (!connectionTweet1 || !connectionTweet2) {
      setConnError("Please select two notes to analyze their relationship.");
      return;
    }
    setConnLoading(true);
    setConnError(null);
    try {
      const data = await fetchAiConnections(connectionTweet1, connectionTweet2);
      setConnectionResult(data);
    } catch (err: any) {
      setConnError("Unable to analyze relationship. Ensure the AI service is active.");
    } finally {
      setConnLoading(false);
    }
  };

  const loadDigest = async () => {
    setDigestLoading(true);
    setDigestError(null);
    try {
      const data = await fetchAiDigest(
        digestTopic === "All" ? undefined : digestTopic,
        digestPeriod
      );
      setDigestData(data);
    } catch (err: any) {
      setDigestError("AI Digest generation failed. Ensure the AI service is active.");
    } finally {
      setDigestLoading(false);
    }
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const data = await fetchAiSemanticSearch(aiSearchQuery.trim());
      setAiSearchResults(data.results || []);
    } catch (err: any) {
      setSearchError("Semantic search failed. Ensure the AI service is active.");
    } finally {
      setSearchLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shadow-purple-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base leading-tight">
                Second Brain Intelligence
              </h2>
              <p className="text-xs text-slate-400">
                Semantic retrieval, relationship reasoning & topic digests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-100 bg-slate-50/70 shrink-0 overflow-x-auto">
          {[
            { id: "recommendations" as const, label: "Recommended Tweets", icon: Compass },
            { id: "connections" as const, label: "Related Ideas", icon: GitCompare },
            { id: "digest" as const, label: "Topic Digest", icon: BookOpen },
            { id: "search" as const, label: "Semantic Search", icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-purple-600 text-purple-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: RECOMMENDATIONS */}
          {activeTab === "recommendations" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100">
                <div className="text-xs text-purple-900">
                  <span className="font-bold">Personalized Discovery:</span> Discovers related notes from your saved brain without self-duplicates.
                </div>
                {savedContent.length > 0 && (
                  <select
                    value={selectedSeedId}
                    onChange={(e) => {
                      setSelectedSeedId(e.target.value);
                      void loadRecommendations(e.target.value);
                    }}
                    className="text-xs bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">Seed: Recent Saved Notes</option>
                    {savedContent.map((c) => (
                      <option key={c._id} value={c._id}>
                        Seed: {c.title.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {recLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                  Retrieving relevant saved thoughts and computing semantic affinities...
                </div>
              ) : recError ? (
                <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{recError}</div>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No recommendations found yet. Save a few notes or tweets to activate intelligent recommendations!
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.tweet_id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-200 hover:shadow-xs transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                          {rec.topic}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Match: {Math.round(rec.similarity_score * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {rec.text}
                      </p>
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{rec.explanation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONNECTIONS BETWEEN IDEAS */}
          {activeTab === "connections" && (
            <div className="space-y-5">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
                Select any two saved notes to uncover how they logically relate (prerequisite, complementary idea, or conflicting claim).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    First Note
                  </label>
                  <select
                    value={connectionTweet1}
                    onChange={(e) => setConnectionTweet1(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">Select Note 1...</option>
                    {savedContent.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Second Note
                  </label>
                  <select
                    value={connectionTweet2}
                    onChange={(e) => setConnectionTweet2(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">Select Note 2...</option>
                    {savedContent.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-right">
                <button
                  onClick={handleExplainConnection}
                  disabled={connLoading || !connectionTweet1 || !connectionTweet2}
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {connLoading ? "Analyzing Connection..." : "Explain Connection"}
                </button>
              </div>

              {connError && (
                <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                  {connError}
                </div>
              )}

              {connectionResult && (
                <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700 px-2.5 py-1 bg-white rounded-lg border border-purple-200 shadow-2xs">
                      {connectionResult.relationship_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Confidence: {Math.round(connectionResult.confidence * 100)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {connectionResult.explanation}
                  </p>

                  {connectionResult.evidence && connectionResult.evidence.length > 0 && (
                    <div className="pt-2 border-t border-purple-100 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Grounding Evidence:
                      </p>
                      {connectionResult.evidence.map((ev, i) => (
                        <p key={i} className="text-[11px] text-slate-600 italic bg-white/80 p-2 rounded-lg border border-purple-50">
                          "{ev}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TOPIC DIGEST */}
          {activeTab === "digest" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-700">Topic:</span>
                    <select
                      value={digestTopic}
                      onChange={(e) => {
                        setDigestTopic(e.target.value);
                        void loadDigest();
                      }}
                      className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700"
                    >
                      <option value="All">All Topics</option>
                      <option value="Artificial Intelligence and LLMs">AI & LLMs</option>
                      <option value="Machine Learning and Data Science">Machine Learning</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="React, Node.js, and System Design">System Design</option>
                      <option value="Productivity and Knowledge Management">Productivity</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-700">Period:</span>
                    <select
                      value={digestPeriod}
                      onChange={(e) => {
                        setDigestPeriod(Number(e.target.value));
                        void loadDigest();
                      }}
                      className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700"
                    >
                      <option value={30}>Last 30 Days</option>
                      <option value={60}>Last 60 Days</option>
                      <option value={90}>Last 90 Days</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={loadDigest}
                  disabled={digestLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-xl transition-colors cursor-pointer"
                >
                  {digestLoading ? "Synthesizing..." : "Refresh Digest"}
                </button>
              </div>

              {digestLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                  Grouping topics, extracting recurring patterns, and identifying knowledge gaps...
                </div>
              ) : digestError ? (
                <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                  {digestError}
                </div>
              ) : digestData ? (
                <div className="space-y-4">
                  {/* Executive Summary */}
                  <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100">
                    <h3 className="text-xs font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-purple-600" /> Executive Knowledge Summary
                    </h3>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {digestData.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recurring Themes */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Recurring Core Ideas
                      </h4>
                      <ul className="text-xs text-slate-600 space-y-1.5 pl-1">
                        {digestData.recurring_themes.map((th, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-purple-500 font-bold">•</span>
                            <span>{th}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Knowledge Gaps */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Potential Blindspots
                      </h4>
                      <ul className="text-xs text-slate-600 space-y-1.5 pl-1">
                        {digestData.knowledge_gaps.map((gp, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{gp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Explore Next */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-purple-600" /> Explore Next
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {digestData.suggested_explorations.map((exp, i) => (
                        <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-100 text-xs text-slate-700 font-medium">
                          → {exp}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 4: SEMANTIC SEARCH */}
          {activeTab === "search" && (
            <div className="space-y-4">
              <form onSubmit={handleAiSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  placeholder="Ask a question or concept (e.g. 'How to optimize context windows?')..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={searchLoading || !aiSearchQuery.trim()}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
                >
                  {searchLoading ? "Searching..." : "Semantic Search"}
                </button>
              </form>

              {searchError && (
                <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                  {searchError}
                </div>
              )}

              {aiSearchResults.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-400 font-medium">
                    Found {aiSearchResults.length} conceptually relevant notes:
                  </p>
                  {aiSearchResults.map((item) => (
                    <div
                      key={item.tweet_id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-purple-200 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-purple-700">
                          {item.topic} &gt; {item.subtopic}
                        </span>
                        <span className="text-slate-400 font-mono">
                          Score: {Math.round(item.similarity_score * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
