import React from "react";
import {
  FileText,
  Link2,
  ExternalLink,
  Trash2,
  Edit2,
  Calendar,
} from "lucide-react";
import { TwitterIcon, YouTubeIcon } from "./Icons";
import type { IContent, ContentType } from "../types";

interface ContentCardProps {
  item: IContent;
  onEdit?: (item: IContent) => void;
  onDelete?: (id: string) => void;
  onTagClick?: (tagName: string) => void;
  readOnly?: boolean;
}

const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
};

export const ContentCard: React.FC<ContentCardProps> = ({
  item,
  onEdit,
  onDelete,
  onTagClick,
  readOnly = false,
}) => {
  const typeIcons: Record<ContentType, React.ReactNode> = {
    tweet: <TwitterIcon className="w-4 h-4 text-sky-500" />,
    youtube: <YouTubeIcon className="w-4 h-4 text-red-500" />,
    document: <FileText className="w-4 h-4 text-amber-500" />,
    link: <Link2 className="w-4 h-4 text-emerald-500" />,
    text: <FileText className="w-4 h-4 text-purple-500" />,
  };

  const youtubeEmbedUrl =
    item.type === "youtube" ? getYouTubeEmbedUrl(item.link) : null;

  const formattedDate = new Date(item.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 group">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
              {typeIcons[item.type] || <FileText className="w-4 h-4 text-slate-400" />}
            </div>
            <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-1 group-hover:text-purple-700 transition-colors">
              {item.title}
            </h3>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                title="Open link"
                className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {!readOnly && onEdit && (
              <button
                onClick={() => onEdit(item)}
                title="Edit note"
                className="p-1.5 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {!readOnly && onDelete && (
              <button
                onClick={() => onDelete(item._id)}
                title="Delete note"
                className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Media / Embed Preview */}
        {youtubeEmbedUrl && (
          <div className="mb-3.5 rounded-xl overflow-hidden aspect-video bg-black/5 border border-slate-100">
            <iframe
              src={youtubeEmbedUrl}
              title={item.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {item.type === "tweet" && item.link && (
          <div className="mb-3.5 p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-sky-600 font-medium">
              <TwitterIcon className="w-3.5 h-3.5" />
              <span>Tweet Reference</span>
            </div>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:text-sky-600 hover:underline break-all block"
            >
              {item.link}
            </a>
          </div>
        )}

        {item.type === "link" && item.link && !youtubeEmbedUrl && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-600 truncate mr-2 font-mono text-[11px]">
              {item.link.replace(/^https?:\/\//, "")}
            </span>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 text-[11px] font-semibold flex items-center gap-1 shrink-0"
            >
              Visit <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Description body */}
        {item.description && (
          <p className="text-slate-600 text-xs leading-relaxed mb-4 line-clamp-4 whitespace-pre-line">
            {item.description}
          </p>
        )}
      </div>

      {/* Card Footer: Tags & Date */}
      <div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.tags.map((tag, idx) => {
              const tagName =
                typeof tag === "string" ? tag : tag.name || "tag";
              return (
                <button
                  key={idx}
                  onClick={() => onTagClick && onTagClick(tagName)}
                  className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[11px] font-medium hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  #{tagName}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <Calendar className="w-3 h-3 text-slate-300" />
          <span>Added on {formattedDate}</span>
        </div>
      </div>
    </div>
  );
};
