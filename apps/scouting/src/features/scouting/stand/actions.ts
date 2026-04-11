"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { cacheTags } from "@/lib/cache";
import {
  lookupTeamMatch as lookupTeamMatchLogic,
  submitStandForm as submitStandFormLogic,
} from "./logic";
import { StandFormSchema } from "./types";

export async function lookupTeamMatch(matchNumber: number, teamNumber: number) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember?.organizationId) {
      return { error: "No active organization" };
    }

    return await lookupTeamMatchLogic(matchNumber, teamNumber, activeMember.organizationId);
  } catch (error) {
    console.error("Lookup team match error:", error);
    return { error: "Failed to lookup match" };
  }
}

export async function submitStandForm(data: unknown) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const activeMember = await auth.api.getActiveMember({ headers: await headers() });
    if (!activeMember) {
      return { error: "No active member" };
    }

    const validated = StandFormSchema.parse(data);
    const result = await submitStandFormLogic(
      validated,
      activeMember.id,
      activeMember.organizationId
    );

    if ("success" in result) {
      revalidateTag(cacheTags.leaderboardStand(activeMember.organizationId), "max");
      revalidateTag(cacheTags.analysisStandFormCount, "max");
      if (result.eventId) {
        revalidateTag(cacheTags.teamMetrics(result.eventId), "max");
        if (result.teamNumber) {
          revalidateTag(cacheTags.teamCommentSummary(result.teamNumber, result.eventId), "max");
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Submit stand form error:", error);
    if (error instanceof Error && error.message.includes("uniq_stand_form_active_submission")) {
      return { error: "You have already submitted a form for this match and team" };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to submit form" };
  }
}
