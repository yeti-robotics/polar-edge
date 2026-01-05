import { MatchUploadForm } from "./form";

import { Toaster } from "@repo/ui/components/toaster";

export default function MatchUploadPage() {
	// This page is intentionally left blank as a placeholder for future match upload functionality.
	// Currently, it serves as a scaffold for potential match upload features.

	return (
		<div>
			<h1 className="mb-4 text-2xl font-bold">Match Schedule Upload</h1>
			<MatchUploadForm />
			<Toaster />
		</div>
	);
}
