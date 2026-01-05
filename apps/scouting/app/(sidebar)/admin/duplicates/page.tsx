import { DuplicateFormsTable } from "./duplicate-forms-table";

import { auth } from "@/lib/auth";
import { forms } from "@/lib/data";
import { UserRole } from "@/lib/database/schema";
import { redirect } from "next/navigation";

export default async function DuplicatesPage() {
	const session = await auth();

	if (!session?.user || session.user.role !== UserRole.ADMIN) {
		redirect("/");
	}

	const duplicates = await forms.getDuplicates();

	return (
		<div className="container mx-auto py-10">
			<h1 className="mb-6 text-2xl font-bold">Manage Duplicate Forms</h1>
			<DuplicateFormsTable duplicates={duplicates} />
		</div>
	);
}
