"use server";

import {
  createServerValidate,
  initialFormState,
  ServerValidateError,
} from "@tanstack/react-form-nextjs";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { pitForm, pitPhoto } from "@/lib/database/schema";
import { FormSchema, formOpts } from "./shared";

const serverValidate = createServerValidate({
  ...formOpts,
  onServerValidate: FormSchema,
});

export async function submitPitForm(_prevState: unknown, formData: FormData) {
  try {
    const activeMember = await auth.api.getActiveMember({ headers: await headers() });

    if (!activeMember) {
      return {
        ...initialFormState,
        _error: "You must be signed in to submit the pit form.",
      };
    }

    const validated = await serverValidate(formData, (entry) => {
      if (entry.path === "teamNumber" || entry.path === "capacity" || entry.path === "weight") {
        return Number(entry.input);
      }
      if (entry.path === "canTrench" || entry.path === "canBump" || entry.path === "canShuttle") {
        return entry.input === "on";
      }
      return entry.input;
    });

    // Parse and validate photo keys
    const photoKeysJson = formData.get("photoKeys");
    let photoKeys: string[] = [];

    if (photoKeysJson && typeof photoKeysJson === "string") {
      try {
        const parsed = JSON.parse(photoKeysJson);
        if (Array.isArray(parsed)) {
          photoKeys = parsed.filter((key): key is string => {
            // Validate: must be a non-empty string and start with org prefix
            return (
              typeof key === "string" &&
              key.length > 0 &&
              key.startsWith(`${activeMember.organizationId}/`)
            );
          });

          // Ensure max 5 photos
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

    // Insert pit form and get the ID
    const [insertedForm] = await db
      .insert(pitForm)
      .values({
        teamNumber: validated.teamNumber,
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
        scoutMemberId: activeMember.id,
      })
      .returning({ id: pitForm.id });

    // Insert photo references if any
    if (photoKeys.length > 0 && insertedForm) {
      await db.insert(pitPhoto).values(
        photoKeys.map((storageKey, index) => ({
          pitFormId: insertedForm.id,
          storageKey,
          index,
        }))
      );
    }
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

  return {
    ...initialFormState,
    _success: true,
  };
}
