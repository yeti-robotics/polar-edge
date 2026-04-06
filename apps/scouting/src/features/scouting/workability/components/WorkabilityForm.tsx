"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/components/combobox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@repo/ui/components/field";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Slider } from "@repo/ui/components/slider";
import { toast } from "@repo/ui/components/sonner";
import { Textarea } from "@repo/ui/components/textarea";
import {
  initialFormState,
  mergeForm,
  useForm,
  useStore,
  useTransform,
} from "@tanstack/react-form-nextjs";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { submitWorkabilityForm } from "../actions";
import {
  type EditableWorkabilitySubmission,
  FormSchema,
  formOpts,
  normalizeWorkabilityRating,
  WORKABILITY_FORM_DEFAULT_VALUES,
  WORKABILITY_NOTES_MAX_LENGTH,
  WORKABILITY_RATING_DEFAULT,
  WORKABILITY_RATING_MAX,
  WORKABILITY_RATING_MIN,
  WORKABILITY_RATING_OPTIONS,
  WORKABILITY_ROLE_DESCRIPTIONS,
  WORKABILITY_ROLE_LABELS,
  WORKABILITY_ROLE_OPTIONS,
  type WorkabilityMatchOption,
  type WorkabilityRole,
} from "../types";

interface WorkabilityFormProps {
  matchOptions: WorkabilityMatchOption[];
  initialSubmissions: EditableWorkabilitySubmission[];
}

interface WorkabilityFormValues {
  matchNumber: number;
  teamNumber: number;
  role: WorkabilityRole;
  rating: number;
  notes: string;
}

type WorkabilitySubmitState = typeof initialFormState & {
  _success?: boolean;
  _error?: string;
  submission?: EditableWorkabilitySubmission | null;
};

function getSubmissionKey(matchNumber: number, teamNumber: number, role: WorkabilityRole) {
  return `${matchNumber}:${teamNumber}:${role}`;
}

function formatMatchLabel(matchOption: WorkabilityMatchOption) {
  return `Match ${matchOption.matchNumber}`;
}

function formatMatchTeamSummary(matchOption: WorkabilityMatchOption) {
  return matchOption.teams.map((team) => team.teamNumber).join(", ");
}

function formatMatchTeamLabel(team: WorkabilityMatchOption["teams"][number]) {
  const allianceLabel = `${team.alliance === "red" ? "Red" : "Blue"} ${team.position}`;
  return `${team.teamNumber} - ${team.teamName} (${allianceLabel})`;
}

export function WorkabilityForm({ matchOptions, initialSubmissions }: WorkabilityFormProps) {
  const [state, action, isPending] = useActionState(
    submitWorkabilityForm as (
      prevState: WorkabilitySubmitState,
      formData: FormData
    ) => Promise<WorkabilitySubmitState>,
    initialFormState as WorkabilitySubmitState
  );
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const hydratedSelectionRef = useRef<string | null>(null);
  const lastHandledSuccess = useRef<typeof state | null>(null);
  const lastHandledError = useRef<typeof state | null>(null);

  const form = useForm({
    ...formOpts,
    transform: useTransform((baseForm) => mergeForm(baseForm, state ?? {}), [state]),
    validators: {
      onSubmit: FormSchema,
    },
  });

  const submissionMap = useMemo(() => {
    return new Map<string, EditableWorkabilitySubmission>(
      submissions.map((submission) => [
        getSubmissionKey(submission.matchNumber, submission.teamNumber, submission.role),
        submission,
      ])
    );
  }, [submissions]);

  const matchOptionMap = useMemo(
    () =>
      new Map<number, WorkabilityMatchOption>(
        matchOptions.map((option) => [option.matchNumber, option])
      ),
    [matchOptions]
  );

  const selectedMatchNumber = useStore(form.store, (state) => {
    const matchNumber = state.values.matchNumber;
    return typeof matchNumber === "number" ? matchNumber : Number(matchNumber ?? 0) || 0;
  });
  const selectedTeamNumber = useStore(form.store, (state) => {
    const teamNumber = state.values.teamNumber;
    return typeof teamNumber === "number" ? teamNumber : Number(teamNumber ?? 0) || 0;
  });
  const selectedRole = useStore(form.store, (state) => {
    const role = state.values.role;
    return typeof role === "string" ? (role as WorkabilityRole) : WORKABILITY_FORM_DEFAULT_VALUES.role;
  });
  const selectedMatch = matchOptionMap.get(selectedMatchNumber) ?? null;
  const matchTeams = selectedMatch?.teams ?? [];

  useEffect(() => {
    if (selectedTeamNumber === 0) {
      return;
    }

    const teamExistsInMatch = matchTeams.some((team) => team.teamNumber === selectedTeamNumber);
    if (!teamExistsInMatch) {
      form.setFieldValue("teamNumber", 0);
    }
  }, [form, matchTeams, selectedTeamNumber]);

  useEffect(() => {
    const selectionKey =
      selectedMatchNumber > 0 && selectedTeamNumber > 0
        ? getSubmissionKey(selectedMatchNumber, selectedTeamNumber, selectedRole)
        : null;

    if (selectionKey === hydratedSelectionRef.current) {
      return;
    }

    if (!selectionKey) {
      hydratedSelectionRef.current = null;
      form.setFieldValue("rating", WORKABILITY_RATING_DEFAULT);
      form.setFieldValue("notes", "");
      return;
    }

    const existingSubmission = submissionMap.get(selectionKey);
    form.setFieldValue(
      "rating",
      existingSubmission
        ? normalizeWorkabilityRating(existingSubmission.rating)
        : WORKABILITY_RATING_DEFAULT
    );
    form.setFieldValue("notes", existingSubmission?.notes ?? "");
    hydratedSelectionRef.current = selectionKey;
  }, [form, selectedMatchNumber, selectedRole, selectedTeamNumber, submissionMap]);

  useEffect(() => {
    if (
      state &&
      "_success" in state &&
      state !== lastHandledSuccess.current &&
      "submission" in state &&
      state.submission
    ) {
      lastHandledSuccess.current = state;
      const savedSubmission = state.submission;

      setSubmissions((current) => {
        const filtered = current.filter(
          (submission) =>
            !(
              submission.matchNumber === savedSubmission.matchNumber &&
              submission.teamNumber === savedSubmission.teamNumber &&
              submission.role === savedSubmission.role
            )
        );

        return [savedSubmission, ...filtered];
      });

      form.setFieldValue("matchNumber", savedSubmission.matchNumber);
      form.setFieldValue("teamNumber", savedSubmission.teamNumber);
      form.setFieldValue("role", savedSubmission.role);
      form.setFieldValue("rating", normalizeWorkabilityRating(savedSubmission.rating));
      form.setFieldValue("notes", savedSubmission.notes);
      hydratedSelectionRef.current = getSubmissionKey(
        savedSubmission.matchNumber,
        savedSubmission.teamNumber,
        savedSubmission.role
      );

      toast.success("Workability feedback saved.", {
        position: "bottom-right",
      });
    }

    if (
      state &&
      "_error" in state &&
      state !== lastHandledError.current &&
      typeof state._error === "string"
    ) {
      lastHandledError.current = state;
      toast.error(state._error, {
        position: "top-right",
      });
    }
  }, [form, state]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await form.handleSubmit(event);
    if (!form.state.isValid) {
      return;
    }

    const values = form.state.values as WorkabilityFormValues;
    const formData = new FormData();
    formData.append("matchNumber", String(values.matchNumber));
    formData.append("teamNumber", String(values.teamNumber));
    formData.append("role", values.role);
    formData.append("rating", String(values.rating));
    formData.append("notes", values.notes);

    startTransition(() => {
      action(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Team & Perspective</CardTitle>
          <CardDescription>
            Choose the match first, then rate how easy that team was to work with in that specific
            appearance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form.Field name="matchNumber">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field>
                  <FieldLabel>Match</FieldLabel>
                  <Combobox
                    id={field.name}
                    name={field.name}
                    value={
                      typeof field.state.value === "number" && field.state.value > 0
                        ? String(field.state.value)
                        : ""
                    }
                    onValueChange={(value) => {
                      field.handleChange(value ? Number(value) : 0);
                      form.setFieldValue("teamNumber", 0);
                    }}
                    items={matchOptions}
                    itemToStringLabel={(value) => {
                      const matchOption = matchOptions.find(
                        (item) => item.matchNumber.toString() === value
                      );
                      return matchOption ? formatMatchLabel(matchOption) : (value ?? "");
                    }}
                  >
                    <ComboboxInput
                      onBlur={field.handleBlur}
                      aria-invalid={isInvalid}
                      aria-label="Match number"
                      placeholder="Select a match from the active event"
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No matches found.</ComboboxEmpty>
                      <ComboboxList>
                        {(matchOption) => (
                          <ComboboxItem
                            key={matchOption.matchNumber}
                            value={matchOption.matchNumber.toString()}
                          >
                            <div className="flex flex-col">
                              <span>{formatMatchLabel(matchOption)}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatMatchTeamSummary(matchOption)}
                              </span>
                            </div>
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FieldDescription>
                    Workability feedback is tracked per match so repeated pairings stay distinct.
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="teamNumber">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field>
                  <FieldLabel>Team Number</FieldLabel>
                  <Combobox
                    key={selectedMatchNumber > 0 ? `match-${selectedMatchNumber}` : "match-empty"}
                    id={field.name}
                    name={field.name}
                    value={
                      typeof field.state.value === "number" && field.state.value > 0
                        ? String(field.state.value)
                        : ""
                    }
                    onValueChange={(value) => {
                      field.handleChange(value ? Number(value) : 0);
                    }}
                    items={matchTeams}
                    itemToStringLabel={(value) => {
                      const team = matchTeams.find((item) => item.teamNumber.toString() === value);
                      return team ? formatMatchTeamLabel(team) : (value ?? "");
                    }}
                  >
                    <ComboboxInput
                      onBlur={field.handleBlur}
                      aria-invalid={isInvalid}
                      aria-label="Team number"
                      placeholder={
                        selectedMatchNumber > 0
                          ? "Select a team from the chosen match"
                          : "Choose a match first"
                      }
                      disabled={selectedMatchNumber <= 0}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>
                        {selectedMatchNumber > 0
                          ? "No teams found for that match."
                          : "Choose a match first."}
                      </ComboboxEmpty>
                      <ComboboxList>
                        {(team) => (
                          <ComboboxItem key={team.teamNumber} value={team.teamNumber.toString()}>
                            {formatMatchTeamLabel(team)}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FieldDescription>
                    Only teams that actually played in the selected match are available here.
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="role">
            {(field) => {
              const fieldValue =
                typeof field.state.value === "string" ? field.state.value : "driver";

              return (
                <FieldSet>
                  <FieldTitle>Scouting Perspective</FieldTitle>
                  <RadioGroup
                    value={fieldValue}
                    onValueChange={(value) => field.handleChange(value as WorkabilityRole)}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {WORKABILITY_ROLE_OPTIONS.map((role) => (
                      <div key={role}>
                        <RadioGroupItem id={`role-${role}`} value={role} className="peer sr-only" />
                        <Label
                          htmlFor={`role-${role}`}
                          className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border bg-muted/40 px-4 py-3 transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                        >
                          <span className="font-medium">{WORKABILITY_ROLE_LABELS[role]}</span>
                          <span className="text-sm text-muted-foreground">
                            {WORKABILITY_ROLE_DESCRIPTIONS[role]}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FieldSet>
              );
            }}
          </form.Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workability Rating</CardTitle>
          <CardDescription>
            Use a simple 1-5 scale where 1 is very difficult to work with and 5 is very easy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form.Field name="rating">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const fieldValue = normalizeWorkabilityRating(
                typeof field.state.value === "number"
                  ? field.state.value
                  : WORKABILITY_RATING_DEFAULT
              );

              return (
                <Field className="gap-4">
                  <FieldLabel className="sr-only">Workability rating</FieldLabel>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current rating</span>
                    <span className="text-lg font-semibold tabular-nums">
                      {fieldValue} / {WORKABILITY_RATING_MAX}
                    </span>
                  </div>
                  <Slider
                    id={field.name}
                    name={field.name}
                    min={WORKABILITY_RATING_MIN}
                    max={WORKABILITY_RATING_MAX}
                    step={1}
                    value={[fieldValue]}
                    onBlur={field.handleBlur}
                    onValueChange={(value) =>
                      field.handleChange(value[0] ?? WORKABILITY_RATING_DEFAULT)
                    }
                    aria-invalid={isInvalid}
                    aria-label="Workability rating"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {WORKABILITY_RATING_OPTIONS.map((rating) => (
                      <span key={rating} className="w-6 text-center tabular-nums">
                        {rating}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>1 = Very difficult</span>
                    <span>5 = Very easy</span>
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader className="gap-1">
          <CardTitle>Notes</CardTitle>
          <CardDescription>
            Capture the “why” behind the rating so strategy can use it during alliance selection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <form.Field name="notes">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const fieldValue = typeof field.state.value === "string" ? field.state.value : "";

              return (
                <Field>
                  <FieldLabel htmlFor={field.name} className="sr-only">
                    Qualitative notes
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={fieldValue}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.currentTarget.value)}
                    placeholder="Examples: easy to coordinate cycles with, blocks lanes, great comms, wants feeder role, late on climbs..."
                    className="min-h-36 resize-y"
                    aria-invalid={isInvalid}
                  />
                  <FieldDescription>
                    Helpful details include communication, cycle spacing, field awareness, and role
                    fit.
                  </FieldDescription>
                  <div className="text-right text-xs text-muted-foreground">
                    {fieldValue.trim().length} / {WORKABILITY_NOTES_MAX_LENGTH}
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 bg-background pb-5 pt-3">
        <Button type="submit" disabled={form.state.isSubmitting || isPending} className="w-full">
          {form.state.isSubmitting || isPending ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
}
