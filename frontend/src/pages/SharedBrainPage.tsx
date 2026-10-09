import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSharedBrainApi } from "../api/client";
import type { IContent, ContentType } from "../types";
import { ContentCard } from "../components/ContentCard";
import { Brain, Globe, Search, ArrowRight, ShieldAlert } from "lucide-react";

export const SharedBrainPage: React.FC = () => {
  const { shareLink } = useParams<{ shareLink: string }>();
  const [username, setUsername] = useState<string>("");
  const [contentList, setContentList] = useState<IContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | ContentType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const loadBrain = async () => {
      if (!shareLink) {
        setError("Invalid share link");
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchSharedBrainApi(shareLink);
        setUsername(data.username);
        setContentList(data.content || []);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "This shared brain link has expired, been revoked, or does not exist."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadBrain();
  }, [shareLink]);

  const filteredContent = contentList.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Public Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-800 leading-tight">
                Second Brain
              </h1>
              <p className="text-[11px] text-slate-400">Public Knowledge Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shadow-2xs"
            >
              <span>Build Your Second Brain</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-24 text-xs text-slate-400">
            Loading shared knowledge base...
          </div>
        ) : error ? (
          <div className="text-center py-20 max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg mb-2">
              Unavailable Link
            </h2>
            <p className="text-xs text-slate-500 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
            >
              Go to Second Brain Home
            </Link>
          </div>
        ) : (
          <div>
            {/* Owner Hero Banner */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 mb-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl uppercase">
                  {username.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">
                      {username}'s Second Brain
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-semibold flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Curated collection of {contentList.length} resources, tweets, videos, and articles
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "tweet", label: "Tweets" },
                    { id: "youtube", label: "Videos" },
                    { id: "document", label: "Documents" },
                    { id: "link", label: "Links" },
                    { id: "text", label: "Notes" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTypeFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      typeFilter === tab.id
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search shared notes..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Content Grid */}
            {filteredContent.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
                No items match your filter criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredContent.map((item) => (
                  <ContentCard key={item._id} item={item} readOnly={true} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
