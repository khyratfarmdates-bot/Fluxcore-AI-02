import React from "react";
import { CinematicOnboarding } from "./CinematicOnboarding";
import { auth } from "../lib/firebase";

export function OnboardingView({ onComplete }: { onComplete: () => void }) {
  const user = auth.currentUser;

  if (!user) return null;

  return (
    <CinematicOnboarding user={user} onComplete={onComplete} />
  );
}
