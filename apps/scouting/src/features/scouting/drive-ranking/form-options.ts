import { formOptions } from "@tanstack/react-form-nextjs";

export const ALLIANCE_OPTIONS = ["red", "blue"] as const;

const defaultValues = {
  matchNumber: 0,
  alliance: "red" as (typeof ALLIANCE_OPTIONS)[number],
};

export const driveRankingFormOpts = formOptions({
  defaultValues,
});
