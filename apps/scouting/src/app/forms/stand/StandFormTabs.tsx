"use client";

import { ActionPhaseTab } from "./components/ActionPhaseTab";
import { CommentsTab } from "./components/CommentsTab";
import { MatchSelectionTab } from "./components/MatchSelectionTab";
import { SubmitDialog } from "./components/SubmitDialog";
import { useNavigation } from "./contexts/NavigationContext";

/**
 * Main tab switcher for stand form.
 * Uses new component composition with split contexts.
 */
export function StandFormTabs() {
  const { state } = useNavigation();

  switch (state.currentStage) {
    case "match_selection":
      return <MatchSelectionTab />;
    case "autonomous":
      return <ActionPhaseTab phase="auto" />;
    case "teleop":
      return <ActionPhaseTab phase="teleop" />;
    case "comments":
      return <CommentsTab />;
    case "submit":
      return <SubmitDialog />;
  }
}
