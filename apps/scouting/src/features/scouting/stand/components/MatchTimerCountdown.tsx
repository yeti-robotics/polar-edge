"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "../contexts/ActionStateContext";
import {
  AUTO_DURATION_SECONDS,
  MATCH_DURATION_SECONDS,
  TELEOP_START_SECONDS,
  useMatchTimer,
} from "../contexts/MatchTimerContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useStandFormActions } from "../hooks/useStandFormActions";

/**
 * Match period countdown timer with automatic phase transitions.
 *
 * Each transition (auto → teleop, teleop → comments) fires at most once.
 * If a cycle is in progress when the period expires, the transition is
 * deferred until the action completes.
 */
export function MatchTimerCountdown() {
  const { state: timerState, dispatch: dispatchTimer } = useMatchTimer();
  const { state: navState, dispatch: dispatchNav } = useNavigation();
  const { state: actionState } = useActionState();
  const { prepareForPhaseTransition } = useStandFormActions();
  const [, setTick] = useState(0);

  const { matchStartedAt, autoTransitionComplete, teleopTransitionComplete } = timerState;
  const { currentStage } = navState;
  const { activeAction } = actionState;

  // Refs for interval callback — avoids stale closures
  const currentStageRef = useRef(currentStage);
  currentStageRef.current = currentStage;
  const activeActionRef = useRef(activeAction);
  activeActionRef.current = activeAction;
  const autoTransitionCompleteRef = useRef(autoTransitionComplete);
  autoTransitionCompleteRef.current = autoTransitionComplete;
  const teleopTransitionCompleteRef = useRef(teleopTransitionComplete);
  teleopTransitionCompleteRef.current = teleopTransitionComplete;
  const prepareRef = useRef(prepareForPhaseTransition);
  prepareRef.current = prepareForPhaseTransition;
  const dispatchNavRef = useRef(dispatchNav);
  dispatchNavRef.current = dispatchNav;
  const dispatchTimerRef = useRef(dispatchTimer);
  dispatchTimerRef.current = dispatchTimer;

  // Display tick — 1 Hz
  useEffect(() => {
    if (!matchStartedAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [matchStartedAt]);

  // Auto-transition — 2 Hz polling, no immediate check on mount
  useEffect(() => {
    if (!matchStartedAt) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - matchStartedAt) / 1000;
      const stage = currentStageRef.current;
      const action = activeActionRef.current;

      // Transition after auto + 3s delay
      if (
        !autoTransitionCompleteRef.current &&
        stage === "autonomous" &&
        elapsed >= TELEOP_START_SECONDS &&
        !action
      ) {
        prepareRef.current();
        dispatchNavRef.current({ type: "set_stage", payload: "teleop" });
        dispatchTimerRef.current({ type: "complete_auto_transition" });
      }

      if (
        !teleopTransitionCompleteRef.current &&
        stage === "teleop" &&
        elapsed >= MATCH_DURATION_SECONDS &&
        !action
      ) {
        dispatchNavRef.current({ type: "set_stage", payload: "comments" });
        dispatchTimerRef.current({ type: "complete_teleop_transition" });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [matchStartedAt]);

  if (!matchStartedAt) return null;
  if (currentStage === "match_selection" || currentStage === "comments") return null;

  const elapsed = (Date.now() - matchStartedAt) / 1000;

  let periodLabel: string;
  let remainingSeconds: number;
  let isOvertime = false;
  let isTransition = false;

  if (elapsed < AUTO_DURATION_SECONDS) {
    periodLabel = "AUTO";
    remainingSeconds = Math.max(0, Math.ceil(AUTO_DURATION_SECONDS - elapsed));
  } else if (elapsed < TELEOP_START_SECONDS) {
    periodLabel = "TRANSITION";
    remainingSeconds = Math.max(0, Math.ceil(TELEOP_START_SECONDS - elapsed));
    isTransition = true;
  } else if (elapsed < MATCH_DURATION_SECONDS) {
    periodLabel = "TELEOP";
    remainingSeconds = Math.max(0, Math.ceil(MATCH_DURATION_SECONDS - elapsed));
  } else {
    periodLabel = "TELEOP";
    remainingSeconds = 0;
    isOvertime = true;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isUrgent = !isOvertime && !isTransition && remainingSeconds <= 5;

  return (
    <div
      className={`
        overflow-hidden rounded-lg border
        flex items-center justify-between px-4 py-2.5
        ${
          isOvertime || isUrgent
            ? "border-destructive/30 bg-destructive/5"
            : isTransition
              ? "border-muted-foreground/20 bg-muted/50"
              : elapsed >= TELEOP_START_SECONDS
                ? "border-yeti-400/20 bg-yeti-400/5"
                : "border-yellow-500/20 bg-yellow-500/5"
        }
      `}
    >
      {/* Period badge */}
      <span
        className={`
          text-[10px] font-semibold tracking-[0.2em] uppercase
          px-2 py-0.5 rounded
          ${
            isOvertime || isUrgent
              ? "bg-destructive/15 text-destructive"
              : isTransition
                ? "bg-muted text-muted-foreground"
                : elapsed >= TELEOP_START_SECONDS
                  ? "bg-yeti-400/15 text-yeti-600 dark:text-yeti-300"
                  : "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
          }
        `}
      >
        {periodLabel}
      </span>

      {/* Countdown — fixed-width via monospace to prevent layout shift */}
      <span
        className={`
          font-mono tabular-nums text-2xl font-medium leading-none
          ${
            isOvertime || isUrgent
              ? "text-destructive"
              : isTransition
                ? "text-muted-foreground"
                : "text-foreground"
          }
        `}
      >
        {timeDisplay}
      </span>
    </div>
  );
}
