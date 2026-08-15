"use server";

import {
  createServerValidate,
  initialFormState,
  ServerValidateError,
} from "@tanstack/react-form-nextjs";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { getWorkabilityMatchSelection, upsertWorkabilityForm } from "./logic";
import { FormSchema, formOpts } from "./types";

const serverValidate = createServerValidate({
  ...formOpts,
  onServerValidate: FormSchema,
});

export async function submitWorkabilityForm(_prevState: unknown, formData: FormData) {
  try {
    const activeMember = await auth.api.getActiveMember({ headers: await headers() });

    if (!activeMember) {
      return {
        ...initialFormState,
        _error: "You must be signed in to submit workability feedback.",
      };
    }

    const activeEvent = await getActiveEventForOrganization(activeMember.organizationId);

    if (!activeEvent?.event) {
      return {
        ...initialFormState,
        _error: "No active event is configured for your organization.",
      };
    }

    const validated = await serverValidate(formData, {
      numbers: ["matchNumber", "teamNumber", "rating"],
    });

    const matchSelection = await getWorkabilityMatchSelection(
      activeEvent.event.id,
      Number(validated.matchNumber),
      Number(validated.teamNumber)
    );

    if (!matchSelection) {
      return {
        ...initialFormState,
        _error: `Team ${validated.teamNumber} was not found in match ${validated.matchNumber}.`,
      };
    }

    const submission = await upsertWorkabilityForm({
      eventId: activeEvent.event.id,
      matchId: matchSelection.matchId,
      teamNumber: Number(validated.teamNumber),
      scoutMemberId: activeMember.id,
      role: validated.role,
      rating: Number(validated.rating),
      notes: validated.notes,
    });

    revalidateTag(cacheTags.analysisWorkabilityFormCount, "max");
    revalidateTag(cacheTags.memberWorkability(activeEvent.event.id, activeMember.id), "max");
    revalidateTag(
      cacheTags.workabilityEvent(activeEvent.event.id, activeMember.organizationId),
      "max"
    );

    return {
      ...initialFormState,
      _success: true,
      submission: submission
        ? {
            id: submission.id,
            matchNumber: matchSelection.matchNumber,
            teamNumber: submission.teamNumber,
            role: submission.role,
            rating: submission.rating,
            notes: submission.notes,
            updatedAt: submission.updatedAt.toISOString(),
          }
        : null,
    };
  } catch (error) {
    if (error instanceof ServerValidateError) {
      return error.formState;
    }

    console.error("Workability form submission error:", error);
    return {
      ...initialFormState,
      _error: "Something went wrong. Please try again.",
    };
  }
}
