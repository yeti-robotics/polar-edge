"use server";

import {
  createServerValidate,
  initialFormState,
  ServerValidateError,
} from "@tanstack/react-form-nextjs";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { pitForm } from "@/lib/database/schema";
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

    await db.insert(pitForm).values({
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
    });
  } catch (error) {
    if (error instanceof ServerValidateError) {
      return error.formState;
    }

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
