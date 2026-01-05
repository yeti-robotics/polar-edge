"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

export function DevToolsLoader({ children }: { children: ReactNode }) {
	const params = useSearchParams();
	const devTools = params.get("devtools") === "true";

	if (!devTools) return null;

	return <>{children}</>;
}

export function DevToolsContainer({ children }: { children: ReactNode }) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<DevToolsLoader>{children}</DevToolsLoader>
		</Suspense>
	);
}
