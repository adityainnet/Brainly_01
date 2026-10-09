import React, { useState, useEffect } from "react";
import { X, Share2, Copy, Check, Globe, ShieldAlert } from "lucide-react";
import { getShareLinkApi, revokeShareLinkApi } from "../api/client";

interface ShareBrainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareBrainModal: React.FC<ShareBrainModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [shareHash, setShareHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadShareLink();
    }
  }, [isOpen]);

  const loadShareLink = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getShareLinkApi();
      setShareHash(data.hash);
    } catch (err: any) {
      setError("Failed to fetch share link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    setIsLoading(true);
    try {
      await revokeShareLinkApi();
      setShareHash(null);
    } catch (err) {
      setError("Failed to revoke share link");
    } finally {
      setIsLoading(false);
    }
  };

  const fullShareUrl = shareHash
    ? `${window.location.origin}/share/${shareHash}`
    : "";

  const handleCopy = () => {
    if (!fullShareUrl) return;
    void navigator.clipboard.writeText(fullShareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">Share Second Brain</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="flex items-start gap-3 p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100">
            <Globe className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-purple-900 mb-0.5">
                Public Read-Only Access
              </p>
              Anyone with this link can view your notes, tweets, videos, and documents without needing an account.
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Configuring your share link...
            </div>
          ) : shareHash ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Your Public Link
              </label>
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={fullShareUrl}
                  className="w-full bg-transparent px-2.5 text-xs text-slate-700 font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shrink-0 transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  onClick={handleRevoke}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:underline font-medium cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Revoke public sharing
                </button>
                <a
                  href={fullShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium hover:underline"
                >
                  Preview public brain →
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-slate-500">
                Sharing is currently turned off. Generate a secure link to share your brain.
              </p>
              <button
                onClick={loadShareLink}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Enable Public Sharing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
