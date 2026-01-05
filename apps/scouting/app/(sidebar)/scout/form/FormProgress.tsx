"use client";
import { useStandForm } from "./FormProvider";

import { Progress } from "@repo/ui/components/progress";

/**
 * Progress component for the stand form
 *
 * @component
 * @example
 * ```tsx
 * <FormProgress />
 * ```
 */
export function FormProgress() {
	const { progress } = useStandForm();

	return <Progress className="rounded-none" value={progress} />;
}
