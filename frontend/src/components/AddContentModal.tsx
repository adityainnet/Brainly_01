import React, { useState, useEffect } from "react";
import { X, FileText, Link2, Plus, Sparkles } from "lucide-react";
import { TwitterIcon, YouTubeIcon } from "./Icons";
import type { ContentType, IContent } from "../types";

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    type: ContentType;
    link?: string;
    description?: string;
    tags: string[];
  }) => Promise<void>;
  editItem?: IContent | null;
}

export const AddContentModal: React.FC<AddContentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editItem,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentType>("youtube");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title || "");
      setType(editItem.type || "youtube");
      setLink(editItem.link || "");
      setDescription(editItem.description || "");
      const existingTags = editItem.tags
        ? editItem.tags
            .map((t) => (typeof t === "string" ? t : t.name))
            .join(", ")
        : "";
      setTagsInput(existingTags);
    } else {
      setTitle("");
      setType("youtube");
      setLink("");
      setDescription("");
      setTagsInput("");
    }
    setError(null);
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title");
      return;
    }

    const parsedTags = tagsInput
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => t.length > 0);

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        type,
        link: link.trim() || undefined,
        description: description.trim() || undefined,
        tags: parsedTags,
      });
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to save content. Please check input values."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions: { id: ContentType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "youtube", label: "YouTube", icon: YouTubeIcon },
    { id: "tweet", label: "Tweet", icon: TwitterIcon },
    { id: "document", label: "Document", icon: FileText },
    { id: "link", label: "Link", icon: Link2 },
    { id: "text", label: "Note", icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">
              {editItem ? "Edit Content" : "Add Content"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Content Type
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = type === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setType(opt.id)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white text-purple-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[11px]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Great React Architecture Tutorial"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              required
            />
          </div>

          {/* Link URL (if not pure text) */}
          {type !== "text" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL / Link
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={
                  type === "youtube"
                    ? "https://www.youtube.com/watch?v=..."
                    : type === "tweet"
                    ? "https://x.com/username/status/..."
                    : "https://example.com/article"
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-xs"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key insights, summary, or quotes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tags
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="productivity, coding, ideas (comma separated)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Separate tags with commas. Example: <span className="font-mono">frontend, typescript</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Saving..." : editItem ? "Update Note" : "Add Note"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
