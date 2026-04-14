"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./auth-provider";
import { OnboardingModal } from "./onboarding-modal";

export function OnboardingGate() {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!user) {
      setNeedsOnboarding(false);
      return;
    }

    // Check if onboarding is complete via user metadata
    const metadata = user.user_metadata || {};
    const isComplete = metadata.onboarding_complete === true;

    // Also check if display_name exists (for users who signed up before onboarding was added)
    const hasDisplayName = !!metadata.display_name;

    if (!isComplete && !hasDisplayName) {
      // Small delay so the page doesn't flash before the modal
      const timer = setTimeout(() => setNeedsOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleComplete = () => {
    setNeedsOnboarding(false);
  };

  return <OnboardingModal isOpen={needsOnboarding} onComplete={handleComplete} />;
}
