/**
 * Types for query builders
 */

export type CompLevel = "qm" | "ef" | "qf" | "sf" | "f";

export interface MatchQueryFilters {
  compLevel?: CompLevel;
  setNumber?: number;
  matchNumber?: number;
}
