"use server";

import { auth } from "@/lib/auth";
import { forms } from "@/lib/data";
import { UserRole } from "@/lib/database/schema";
import { revalidatePath } from "next/cache";

export async function deleteForm(formId: string) {
	const session = await auth();

	if (!session?.user) {
		throw new Error("Not authenticated");
	}

	if (session.user.role !== UserRole.ADMIN) {
		throw new Error("Not authorized");
	}

	await forms.deleteById(formId);
	revalidatePath("/admin/duplicates");
}
