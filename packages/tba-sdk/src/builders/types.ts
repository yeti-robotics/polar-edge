/**
 * Types for query builders
 */

import type { components } from "@/generated";

// Re-export Comp_Level from generated types for convenience
export type CompLevel = components["schemas"]["Comp_Level"];

// Get the Match type from generated types
type Match = components["schemas"]["Match"];

// Infer filter type from Match, converting snake_case to camelCase and making all fields optional
export type MatchQueryFilters = Partial<{
  compLevel: Match["comp_level"];
  setNumber: Match["set_number"];
  matchNumber: Match["match_number"];
}>;
