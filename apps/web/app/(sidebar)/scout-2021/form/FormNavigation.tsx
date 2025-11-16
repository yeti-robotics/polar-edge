"use client";

import { useStandForm2021 } from "./FormProvider";
import { StandForm2021Data } from "../data/schema";

import { Button } from "@repo/ui/components/button";
import { useFormContext } from "react-hook-form";

//Makes clear and simple navigation buttons for the form, same thing as 2025 mostly
export function FormNavigation() {
    const {
        goToNextStep, //this is the function that is used to go to the next step
        goToPreviousStep, //this is the function that is used to go to the previous step
        canGoNext, //boolean type, same as the next few
        canGoPrevious,
        isLastStep,
        isSubmitting,
        submitForm,
    } = useStandForm2021();
    const form = useFormContext<StandForm2021Data>();

    return (
        <div className="flex justify-between border-t-2 border-red-900 p-4 bg-gray-950">
            <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={!canGoPrevious}
                className="border-gray-600 text-gray-300 hover:bg-gray-900/50 hover:border-red-800 disabled:opacity-30"
            >
                Previous
            </Button>
            <Button
                type="button"
                onClick={
                    isLastStep ? form.handleSubmit(submitForm) : goToNextStep
                }
                disabled={isLastStep ? isSubmitting : !canGoNext}
                className="bg-red-900 hover:bg-red-800 text-gray-100 border border-red-700 disabled:opacity-30"
            >
                {isLastStep
                    ? isSubmitting
                        ? "Submitting..."
                        : "Submit"
                    : "Next"}
            </Button>
        </div>
    );
}

