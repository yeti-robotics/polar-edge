"use client";

import { useStandForm2021 } from "./FormProvider";
import {
    AutoPeriod,
    ControlPanel,
    Endgame,
    MatchDetail,
    Miscellaneous,
    TeleopPeriod,
} from "./steps";

//Router function for the form steps
//Allows mutli page naviagtion as this is a router function
const nextStep = (name?: string) => {
    switch (name) { //this is the switch statement that is used to return the appropriate step component based on the step ID
        case "auto":
            return <AutoPeriod />;
        case "teleop":
            return <TeleopPeriod />;
        case "control_panel":
            return <ControlPanel />;
        case "endgame":
            return <Endgame />;
        case "misc":
            return <Miscellaneous />;
        default:
            return null;
    }
};

//Redners the current step based on form state
export function StandForm() {
    const { currentStep } = useStandForm2021(); //this is the react hook that is used to get the current step
    //currentStep is the current step that is being displayed in the form which is then set equal to currentStep in the form provider

    return (
        <div>
            {/* Match Detail step stays mounted to preserve team selection state */}
            <div className={currentStep?.id !== "match_detail" ? "hidden" : ""}>
                <MatchDetail />
            </div>
            {/* Render other steps dynamically */}
            {nextStep(currentStep?.id)}
        </div>
    );
}

