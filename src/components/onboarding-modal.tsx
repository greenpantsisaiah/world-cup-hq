"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./auth-provider";
import { createClient } from "@/lib/supabase";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!firstName.trim() || !displayName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      // Update profile with display name
      await updateProfile({ name: displayName.trim() });

      // Store first/last name in auth user metadata
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: displayName.trim(),
          onboarding_complete: true,
        },
      });

      onComplete();
    } catch {
      setError("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  // Auto-generate display name suggestion
  const suggestDisplayName = () => {
    if (firstName && !displayName) {
      setDisplayName(firstName.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[var(--surface)] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[var(--surface-border)] space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-5xl"
                >
                  ⚽
                </motion.div>
                <h2 className="text-2xl font-black">Welcome to World Cup HQ!</h2>
                <p className="text-sm text-[var(--muted)]">
                  Set up your profile so your league knows who you are
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={suggestDisplayName}
                      placeholder="Isaiah"
                      maxLength={50}
                      className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--gold)]/50"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="McPeak"
                      maxLength={50}
                      className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--gold)]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                    Display Name * <span className="normal-case font-normal">— what your league sees</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="The GOAT, CaptainVibes, etc."
                    maxLength={30}
                    className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--gold)]/50"
                  />
                  <p className="text-[10px] text-[var(--muted)] mt-1">
                    This is how you&apos;ll appear on the leaderboard and in the draft
                  </p>
                </div>
              </div>

              {error && (
                <p className="text-sm text-[var(--crimson)]">{error}</p>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !firstName.trim() || !displayName.trim()}
                className="w-full py-3.5 bg-[var(--gold)] text-[var(--background)] font-black rounded-xl hover:bg-[var(--gold-dim)] transition-colors disabled:opacity-50 text-lg"
              >
                {saving ? "Saving..." : "Let's Go! ⚽"}
              </button>

              <p className="text-[10px] text-[var(--muted)] text-center">
                Signed in as {user?.email}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
