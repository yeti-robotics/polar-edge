"use client";

import { useNavigation } from "../contexts/NavigationContext";
import { ActionPhaseTab } from "./ActionPhaseTab";
import { CommentsTab } from "./CommentsTab";
import { MatchSelectionTab } from "./MatchSelectionTab";

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
  }
}
