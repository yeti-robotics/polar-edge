"use client";

import { useStandForm } from "./FormProvider";

import {
	CardHeader,
	CardTitle,
	CardDescription,
} from "@repo/ui/components/card";

export function FormHeader() {
	const { currentStep } = useStandForm();

	return (
		<CardHeader>
			<CardTitle className="font-black">{currentStep?.title}</CardTitle>
			<CardDescription>{currentStep?.description}</CardDescription>
		</CardHeader>
	);
}
