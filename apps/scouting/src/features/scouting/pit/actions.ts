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
import { insertPitForm } from "./logic";
import { FormSchema, formOpts } from "./types";

const serverValidate = createServerValidate({
  ...formOpts,
  onServerValidate: FormSchema,
});

const formDataInfo = {
  numbers: ["teamNumber", "capacity", "weight"],
  booleans: ["canTrench", "canBump", "canShuttle"],
};

export async function submitPitForm(_prevState: unknown, formData: FormData) {
  try {
    const activeMember = await auth.api.getActiveMember({ headers: await headers() });

    if (!activeMember) {
      return {
        ...initialFormState,
        _error: "You must be signed in to submit the pit form.",
      };
    }

    const validated = await serverValidate(formData, formDataInfo as never);

    // Parse and validate photo keys
    const photoKeysJson = formData.get("photoKeys");
    let photoKeys: string[] = [];

    if (photoKeysJson && typeof photoKeysJson === "string") {
      try {
        const parsed = JSON.parse(photoKeysJson);
        if (Array.isArray(parsed)) {
          photoKeys = parsed.filter((key): key is string => {
            return (
              typeof key === "string" &&
              key.length > 0 &&
              key.startsWith(`${activeMember.organizationId}/`)
            );
          });

          if (photoKeys.length > 5) {
            return {
              ...initialFormState,
              _error: "Maximum 5 photos allowed",
            };
          }
        }
      } catch {
        return {
          ...initialFormState,
          _error: "Invalid photo data",
        };
      }
    }

    await insertPitForm(
      {
        teamNumber: Number(validated.teamNumber),
        drivetrainType: validated.drivetrainType === "" ? "other" : validated.drivetrainType,
        canTrench: validated.canTrench ?? false,
        canBump: validated.canBump ?? false,
        canShuttle: validated.canShuttle ?? false,
        capacity: validated.capacity,
        weight: validated.weight,
        climbType:
          validated.climbType === "none"
            ? null
            : validated.climbType === ""
              ? null
              : validated.climbType,
        comments: validated.comments,
        scoutMemberId: activeMember.id,
      },
      photoKeys
    );

    revalidateTag(cacheTags.leaderboardPit(activeMember.organizationId), "max");
    revalidateTag(cacheTags.analysisPitFormCount, "max");

    return {
      ...initialFormState,
      _success: true,
    };
  } catch (error) {
    if (error instanceof ServerValidateError) {
      return error.formState;
    }

    console.error("Pit form submission error:", error);
    return {
      ...initialFormState,
      _error: "Something went wrong. Please try again.",
    };
  }
}
