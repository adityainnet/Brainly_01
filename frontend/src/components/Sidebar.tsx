import React from "react";
import {
  Brain,
  Layers,
  FileText,
  Link2,
  Tag,
  LogOut,
  User,
  Sparkles,
} from "lucide-react";
import { TwitterIcon, YouTubeIcon } from "./Icons";
import { useAuth } from "../context/AuthContext";
import type { ContentType } from "../types";

interface SidebarProps {
  currentFilter: "all" | ContentType | "tags";
  onSelectFilter: (filter: "all" | ContentType | "tags") => void;
  selectedTag?: string;
  onClearTag?: () => void;
  onOpenAiInsights?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  onSelectFilter,
  selectedTag,
  onClearTag,
  onOpenAiInsights,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: "all" as const, label: "All Notes", icon: Layers },
    { id: "tweet" as const, label: "Tweets", icon: TwitterIcon },
    { id: "youtube" as const, label: "Videos", icon: YouTubeIcon },
    { id: "document" as const, label: "Documents", icon: FileText },
    { id: "link" as const, label: "Links", icon: Link2 },
    { id: "tags" as const, label: "Tags", icon: Tag },
  ];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col justify-between fixed left-0 top-0 z-20">
      <div>
        {/* Logo / Branding */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm shadow-purple-200">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 leading-tight">
              Second Brain
            </h1>
            <p className="text-xs text-slate-400">Knowledge Hub</p>
          </div>
        </div>

        {/* Selected Tag Indicator if active */}
        {selectedTag && (
          <div className="mx-4 mt-3 p-2.5 bg-purple-50 rounded-lg flex items-center justify-between text-xs text-purple-700">
            <span className="font-medium truncate">Filter: #{selectedTag}</span>
            <button
              onClick={onClearTag}
              className="text-purple-500 hover:text-purple-800 cursor-pointer text-xs underline font-semibold ml-2"
            >
              Clear
            </button>
          </div>
        )}

        {/* Navigation items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentFilter === item.id && !selectedTag;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onClearTag) onClearTag();
                  onSelectFilter(item.id);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-purple-50 text-purple-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-purple-600" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* AI Brain Insights Button */}
          {onOpenAiInsights && (
            <div className="pt-3 mt-2 border-t border-slate-100">
              <button
                onClick={onOpenAiInsights}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-purple-700 bg-purple-50/70 hover:bg-purple-100 cursor-pointer border border-purple-200/50"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-semibold">Brain Insights</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* User profile & Logout at bottom */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.username}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || "Personal Brain"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
