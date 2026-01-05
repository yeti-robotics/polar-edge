import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function SessionPage() {
	if (process.env.NODE_ENV !== "development") {
		return notFound();
	}

	const session = await auth();

	return (
		<div className="min-h-screen bg-gray-50 px-4 py-8">
			<div className="mx-auto max-w-3xl">
				<h1 className="mb-6 text-2xl font-bold text-gray-900">
					Session Information
				</h1>
				<div className="overflow-hidden rounded-lg bg-white shadow">
					<div className="border-b border-gray-200 px-6 py-5">
						<h2 className="text-lg font-medium text-gray-900">
							Active Session Details
						</h2>
					</div>
					<div className="px-6 py-5">
						{session ? (
							<div className="space-y-4">
								{Object.entries(session).map(([key, value]) => (
									<div
										key={key}
										className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
									>
										<h3 className="mb-1 text-sm font-medium text-gray-500">
											{key}
										</h3>
										<pre className="rounded bg-gray-50 p-3 text-sm break-words whitespace-pre-wrap text-gray-900">
											{JSON.stringify(value, null, 2)}
										</pre>
									</div>
								))}
							</div>
						) : (
							<div className="text-sm text-gray-500">
								No active session found
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
