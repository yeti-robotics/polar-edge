"use client";

import { useStandForm } from "./FormProvider";
import {
	AutoPeriod,
	Endgame,
	MatchDetail,
	Miscellaneous,
	TeleopPeriod,
} from "./steps";

const nextStep = (name?: string) => {
	switch (name) {
		case "auto":
			return <AutoPeriod />;
		case "teleop":
			return <TeleopPeriod />;
		case "endgame":
			return <Endgame />;
		case "misc":
			return <Miscellaneous />;
		default:
			return null;
	}
};

export function StandForm() {
	const { currentStep } = useStandForm();

	return (
		<div>
			<div className={currentStep?.id !== "match_detail" ? "hidden" : ""}>
				<MatchDetail />{" "}
				{/* 
				Don't want match detail component to unmount on render, this will remove team number state if
				the fallback input for no internet is rendered, and thus will force a subsequent fetch and rerender if a user 
				decides to check this step again.
				*/}
			</div>
			{nextStep(currentStep?.id)}
		</div>
	);
}
