"use server";
import { auth } from "@/lib/auth";
import { checkSession } from "@/lib/auth/utils";
import { UserRole } from "@/lib/database/schema";
import { uploadMatchSchedule } from "@/lib/services/match-schedule-upload";

export type SubmitFormResponse =
	| {
			success: false;
			error: string | null;
	  }
	| {
			success: true;
	  };

export async function submitForm(
	_: SubmitFormResponse,
	formData: FormData
): Promise<SubmitFormResponse> {
	const session = await auth();
	const hasPermission = checkSession(UserRole.ADMIN, session);
	if (!hasPermission) {
		return {
			success: false,
			error: "You do not have permission to perform this action.",
		};
	}

	const eventCode = formData.get("eventCode")?.toString().trim();
	const eventName = formData.get("eventName")?.toString().trim();
	const startDate = new Date(formData.get("startDate")?.toString() || "");
	const endDate = new Date(formData.get("endDate")?.toString() || "");
	const csvFile = formData.get("csvUpload") as File;

	if (
		!eventCode ||
		!eventName ||
		isNaN(startDate.getTime()) ||
		isNaN(endDate.getTime()) ||
		!csvFile
	) {
		return { success: false, error: "All fields are required." };
	}

	const csvBuffer = Buffer.from(await csvFile.arrayBuffer());

	const result = await uploadMatchSchedule({
		eventCode,
		eventName,
		startDate,
		endDate,
		csvBuffer,
	}).catch(() => null);

	if (result) {
		return { success: true };
	} else {
		return { success: false, error: "Failed to upload match schedule." };
	}
}
