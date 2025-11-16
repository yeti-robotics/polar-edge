"use client";

import { useStandForm2021 } from "./FormProvider";

import {
    CardHeader,
    CardTitle,
    CardDescription,
} from "@repo/ui/components/card";

//Shows the form with a clean title and header, simple setup, from 2025 mostly
export function FormHeader() {
    const { currentStep } = useStandForm2021(); //this is the react hook that is used to get the current step
    //currentStep is the current step that is being displayed in the form which is then set equal to currentStep in the form provider
    return (
        <CardHeader className="bg-gray-950 border-b-2 border-red-900">
            <CardTitle className="font-black text-red-500">
                {currentStep?.title} {/*this is the title of the current step that is being displayed in the form*/}
            </CardTitle>
            <CardDescription className="text-gray-400">
                {currentStep?.description}
            </CardDescription>
        </CardHeader>
    );
}

