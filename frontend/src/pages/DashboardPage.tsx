import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "../components/Sidebar";
import { ContentCard } from "../components/ContentCard";
import { AddContentModal } from "../components/AddContentModal";
import { ShareBrainModal } from "../components/ShareBrainModal";
import { BrainInsightsModal } from "../components/BrainInsightsModal";
import {
  fetchContentList,
  createContentApi,
  updateContentApi,
  deleteContentApi,
  fetchTagsApi,
} from "../api/client";
import type { IContent, ContentType, ITag } from "../types";
import {
  Plus,
  Share2,
  Search,
  RefreshCw,
  FolderOpen,
  Sparkles,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const [filter, setFilter] = useState<"all" | ContentType | "tags">("all");
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [contentList, setContentList] = useState<IContent[]>([]);
  const [tags, setTags] = useState<ITag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<IContent | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const typeParam = filter === "all" || filter === "tags" ? undefined : filter;
      const res = await fetchContentList({
        type: typeParam,
        tag: selectedTag,
        search: searchQuery.trim() || undefined,
      });
      setContentList(res.content || []);

      const tagsRes = await fetchTagsApi();
      setTags(tagsRes || []);
    } catch (err) {
      console.error("Failed to load content:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, selectedTag, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleCreateOrUpdate = async (data: {
    title: string;
    type: ContentType;
    link?: string;
    description?: string;
    tags: string[];
  }) => {
    if (editItem) {
      await updateContentApi(editItem._id, data);
    } else {
      await createContentApi(data);
    }
    setEditItem(null);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await deleteContentApi(id);
      await loadData();
    }
  };

  const handleEdit = (item: IContent) => {
    setEditItem(item);
    setIsAddModalOpen(true);
  };

  const handleTagClick = (tagName: string) => {
    setSelectedTag(tagName);
  };

  const titleLabels: Record<string, string> = {
    all: "All Notes",
    tweet: "Tweets",
    youtube: "Videos",
    document: "Documents",
    link: "Links",
    text: "Notes",
    tags: "Tags",
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentFilter={filter}
        onSelectFilter={(newFilter) => {
          setFilter(newFilter);
          setSelectedTag(undefined);
        }}
        selectedTag={selectedTag}
        onClearTag={() => setSelectedTag(undefined)}
        onOpenAiInsights={() => setIsAiModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {selectedTag ? `Notes tagged #${selectedTag}` : titleLabels[filter]}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {contentList.length} {contentList.length === 1 ? "item" : "items"} saved in your brain
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition-all border border-purple-200 shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Brain Insights</span>
            </button>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all border border-slate-200 shadow-2xs cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>Share Brain</span>
            </button>
            <button
              onClick={() => {
                setEditItem(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-semibold transition-all shadow-sm shadow-purple-300 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Content</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-7">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, links, descriptions..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => void loadData()}
            title="Refresh notes"
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>

        {/* Tag Pills bar */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1.5 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Tags:
            </span>
            <button
              onClick={() => setSelectedTag(undefined)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                !selectedTag
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            {tags.map((t) => (
              <button
                key={t._id}
                onClick={() => setSelectedTag(t.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedTag === t.name
                    ? "bg-purple-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        )}

        {/* Content Cards Grid */}
        {isLoading && contentList.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 p-5 h-64 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                  <div className="h-28 bg-slate-100 rounded-xl w-full" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                </div>
                <div className="h-3 bg-slate-100 rounded-md w-1/3" />
              </div>
            ))}
          </div>
        ) : contentList.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200/80 max-w-lg mx-auto shadow-2xs">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No notes found
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">
              {searchQuery || selectedTag || filter !== "all"
                ? "Try clearing your search query or tag filters to see your saved items."
                : "You haven't saved any content to your Second Brain yet. Start organizing your knowledge today!"}
            </p>
            <button
              onClick={() => {
                setEditItem(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Note</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {contentList.map((item) => (
              <ContentCard
                key={item._id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTagClick={handleTagClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Content Modal */}
      <AddContentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditItem(null);
        }}
        onSubmit={handleCreateOrUpdate}
        editItem={editItem}
      />

      {/* Share Brain Modal */}
      <ShareBrainModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* AI Brain Insights Modal */}
      <BrainInsightsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        savedContent={contentList}
      />
    </div>
  );
};
