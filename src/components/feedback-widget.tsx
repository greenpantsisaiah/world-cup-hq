"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./auth-provider";
import { createClient } from "@/lib/supabase";

type FeedbackType = "bug" | "feature" | "idea" | "other";

const TYPE_CONFIG: Record<FeedbackType, { icon: string; label: string; color: string }> = {
  bug: { icon: "🐛", label: "Bug", color: "var(--crimson)" },
  feature: { icon: "✨", label: "Feature", color: "var(--electric)" },
  idea: { icon: "💡", label: "Idea", color: "var(--gold)" },
  other: { icon: "💬", label: "Other", color: "var(--muted)" },
};

export function FeedbackWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("idea");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user || !title.trim()) return;
    setError(null);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("feedback").insert({
        user_id: user.id,
        type,
        title: title.trim(),
        description: description.trim() || null,
        page: window.location.pathname,
      });

      if (insertError) throw insertError;
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setTitle("");
        setDescription("");
      }, 2000);
    } catch {
      setError("Failed to submit. Please try again.");
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-4 z-50 w-12 h-12 rounded-full bg-[var(--electric)] text-white shadow-xl shadow-[var(--electric)]/30 flex items-center justify-center text-xl hover:shadow-2xl transition-shadow"
        title="Send feedback"
      >
        💬
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:max-w-lg md:w-full"
            >
              <div className="bg-[var(--surface)] rounded-t-2xl md:rounded-2xl p-6 shadow-2xl border border-[var(--surface-border)]">
                {submitted ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8 space-y-3"
                  >
                    <div className="text-5xl">🎉</div>
                    <h3 className="text-xl font-black">Thanks!</h3>
                    <p className="text-sm text-[var(--muted)]">Your feedback helps make World Cup HQ better.</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-black">Send Feedback</h3>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-full bg-[var(--surface-light)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)]"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Type picker */}
                    <div className="flex gap-2 mb-4">
                      {(Object.keys(TYPE_CONFIG) as FeedbackType[]).map((t) => {
                        const config = TYPE_CONFIG[t];
                        const isSelected = type === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? "ring-2 shadow-lg"
                                : "bg-[var(--surface-light)] hover:bg-[var(--surface-border)]"
                            }`}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: `${config.color}15`,
                                    color: config.color,
                                    boxShadow: `0 0 0 2px ${config.color}40, 0 4px 12px ${config.color}20`,
                                  }
                                : undefined
                            }
                          >
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Title */}
                    <input
                      type="text"
                      placeholder="What's on your mind?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={200}
                      className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--gold)]/50 mb-3"
                      autoFocus
                    />

                    {/* Description */}
                    <textarea
                      placeholder="Add details (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={2000}
                      className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm resize-none h-24 focus:outline-none focus:border-[var(--gold)]/50 mb-3"
                    />

                    {error && (
                      <p className="text-sm text-[var(--crimson)] mb-3">{error}</p>
                    )}

                    {/* Submit */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--muted)]">
                        From {window.location.pathname}
                      </span>
                      <button
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                        className="px-6 py-2.5 bg-[var(--gold)] text-[var(--background)] font-bold rounded-xl hover:bg-[var(--gold-dim)] transition-colors disabled:opacity-50"
                      >
                        Submit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
