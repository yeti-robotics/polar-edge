"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { toast } from "@repo/ui/components/sonner";
import { TypographyLabel } from "@repo/ui/components/typography";
import { useForm } from "@tanstack/react-form-nextjs";
import { useState, useTransition } from "react";
import { lookupAllianceTeams, submitDriveRanking } from "../actions";
import { ALLIANCE_OPTIONS, driveRankingFormOpts } from "../form-options";
import { type RankingTeam, SortableRankingList } from "./SortableRankingList";

type FormStage = "match_selection" | "ranking";

export function DriveRankingForm() {
  const [stage, setStage] = useState<FormStage>("match_selection");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [matchId, setMatchId] = useState<string | null>(null);
  const [teams, setTeams] = useState<RankingTeam[]>([]);
  const [alreadyRanked, setAlreadyRanked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    ...driveRankingFormOpts,
  });

  async function handleLookup() {
    const { matchNumber, alliance } = form.state.values;
    if (!matchNumber || matchNumber <= 0) {
      setLookupError("Please enter a valid match number");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const result = await lookupAllianceTeams(matchNumber, alliance);

      if ("error" in result) {
        setLookupError(result.error ?? "Unknown error");
        return;
      }

      setMatchId(result.matchId);
      setTeams(result.teams);
      setAlreadyRanked(result.alreadyRanked);
      setStage("ranking");
    } catch {
      setLookupError("Failed to lookup match");
    } finally {
      setLookupLoading(false);
    }
  }

  function handleBack() {
    setStage("match_selection");
    setMatchId(null);
    setTeams([]);
    setLookupError(null);
  }

  function handleSubmit() {
    if (!matchId || teams.length !== 3) return;

    const { matchNumber, alliance } = form.state.values;

    startTransition(async () => {
      const result = await submitDriveRanking({
        matchNumber,
        alliance,
        rankings: teams.map((t) => t.teamNumber),
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Drive team ranking submitted");
      form.reset();
      setStage("match_selection");
      setMatchId(null);
      setTeams([]);
      setAlreadyRanked(false);
    });
  }

  if (stage === "match_selection") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Match & Alliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form.Field name="matchNumber">
            {(field) => (
              <Field>
                <FieldLabel>Match Number</FieldLabel>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Enter match number"
                  value={field.state.value === 0 ? "" : field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value === "" ? 0 : Number(e.target.value))
                  }
                />
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="alliance">
            {(field) => (
              <Field>
                <FieldLabel>Alliance</FieldLabel>
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as (typeof ALLIANCE_OPTIONS)[number])}
                  className="flex gap-2.5"
                >
                  {ALLIANCE_OPTIONS.map((a) => (
                    <div key={a}>
                      <RadioGroupItem id={`alliance-${a}`} value={a} className="peer sr-only" />
                      <Label
                        htmlFor={`alliance-${a}`}
                        className="cursor-pointer select-none rounded-lg border border-border bg-muted/50 px-[18px] py-3 text-sm whitespace-nowrap transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-focus-visible:border-ring"
                      >
                        {a === "red" ? "Red Alliance" : "Blue Alliance"}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </Field>
            )}
          </form.Field>

          {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}
        </CardContent>
        <CardFooter>
          <form.Subscribe selector={(state) => state.values.matchNumber}>
            {(matchNumber) => (
              <Button
                onClick={handleLookup}
                disabled={lookupLoading || !matchNumber || matchNumber <= 0}
                className="w-full"
              >
                {lookupLoading ? "Looking up..." : "Find Teams"}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
    );
  }

  const { matchNumber, alliance } = form.state.values;

  return (
    <Card>
      <CardHeader>
        <TypographyLabel>
          Match {matchNumber} &middot;{" "}
          <span className={alliance === "red" ? "text-red-500" : "text-blue-500"}>
            {alliance} alliance
          </span>
          {alreadyRanked && (
            <span className="text-amber-600"> &middot; overwriting</span>
          )}
        </TypographyLabel>
      </CardHeader>
      <CardContent>
        <SortableRankingList teams={teams} alliance={alliance} onReorder={setTeams} />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={isPending}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Ranking"}
        </Button>
      </CardFooter>
    </Card>
  );
}
