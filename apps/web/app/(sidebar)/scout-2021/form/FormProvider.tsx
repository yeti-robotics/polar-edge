"use client";

import { submitStandForm2021 } from "../actions/submitForm";
import { TeamInMatch } from "../actions/teamsInMatch";
import { formMetadata, StandForm2021Data, standForm2021Schema } from "../data/schema";

import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@repo/ui/components/form";
import { useToast } from "@repo/ui/hooks/use-toast";
import {
    createContext,
    Dispatch,
    SetStateAction,
    useContext,
    useState,
} from "react";
import { FieldErrors, useForm } from "react-hook-form";

//file that gives navigation, validation and submission functionality to the form
//the context type is the type of the context that is being used to give the form navigation, validation and submission functionality
type ScoutForm2021ContextType = { //everything here is created for the formNavigation function in the FormNavigation.tsx file
    currentStepIndex: number;
    currentStep: (typeof formMetadata.steps)[number] | undefined;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    canGoNext: boolean;
    canGoPrevious: boolean;
    isLastStep: boolean;
    isFirstStep: boolean;
    progress: number;
    submitForm: (data: StandForm2021Data) => Promise<void>;
    isSubmitting: boolean;
    formState: {
        errors: FieldErrors<StandForm2021Data>;
        isDirty: boolean;
        isValid: boolean;
    };
    standForm: {
        teams: TeamInMatch[];
        setTeams: Dispatch<SetStateAction<TeamInMatch[]>>;
    };
};

const ScoutForm2021Context = createContext<ScoutForm2021ContextType | null>(null);

//values for the default form values, presets basically
const defaultValues: StandForm2021Data = {
    match_detail: {
        team_number: "" as unknown as number,
        match_number: "" as unknown as number,
    },
    auto: {
        auto_starting_position: "front",
        auto_power_cells_inner: 0,
        auto_power_cells_outer: 0,
        auto_power_cells_lower: 0,
        auto_left_initiation_line: false,
        auto_worked: false,
    },
    teleop: {
        teleop_power_cells_inner: 0,
        teleop_power_cells_outer: 0,
        teleop_power_cells_lower: 0,
        teleop_intake: false,
        teleop_shooting_location: "protected",
        teleop_cycle_speed: "medium",
        teleop_defense_rating: "average",
    },
    control_panel: {
        control_panel_interact: false,
        control_panel_stage: "none",
        control_panel_notes: "",
    },
    endgame: {
        endgame_attempted_climb: false,
        endgame_successful_climb: false,
        endgame_switch_balanced: false,
        endgame_comments: "",
    },
    misc: {
        final_comments: "",
    },
};


//provider component for the form, actually provides the form state, validation and submission functionality
export function StandForm2021Provider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast(); //used a toast here!!!!! 
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const form = useForm<StandForm2021Data>({
        resolver: zodResolver(standForm2021Schema),
        mode: "onBlur", //this is the mode for the form, onBlur is the mode that is used to validate the form when the user blurs the field
        defaultValues, //this is the default values for the form, presets basically
    });

    const [teams, setTeams] = useState<TeamInMatch[]>([]);//teams and set teams are set in the useState hook to manage the teams in the form in the array TeamInMatch

    const currentStep = formMetadata.steps[currentStepIndex];

    // Determine if the current step is the first or last step
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === formMetadata.steps.length - 1;

    // Validating step with schema to determine if user can go on or not
    const validateCurrentStep = () => {
        const currentStepId = currentStep?.id; //this is the id of the current step (value basically)

        if (!currentStepId) {
            console.warn("No step id found for current step");
            return false;
        }

        const currentSchema = currentStep?.schema;

        if (!currentSchema) {
            console.warn("No schema found for current step");
            return false;
        }

        const currentValues = form.getValues();

        // Special validation for match detail
        if (currentStepId === "match_detail") {
            const matchDetails = currentValues.match_detail;
            if (!matchDetails.team_number || !matchDetails.match_number) {
                return false;
            }
        }

        try {
            currentSchema.parse(
                currentValues[currentStepId as keyof StandForm2021Data]
            );
            return true;
        } catch (error) {
            console.error("Validation error:", error);
            return false;
        }
    };

    // Determine if the user can go back or forward
    const canGoPrevious = !isFirstStep;
    const canGoNext = !isLastStep && validateCurrentStep();

    // Calculate progress percentage
    const progress = ((currentStepIndex + 1) / formMetadata.steps.length) * 100;

    const goToNextStep = () => {
        if (canGoNext) {
            setCurrentStepIndex((curr) => curr + 1);
        }
    };

    const goToPreviousStep = () => {
        if (canGoPrevious) {
            setCurrentStepIndex((curr) => curr - 1);
        }
    };

    // Submission checks are done in this try and check block, if the form submission is successful, the form is reset and the current step is set to the starting state
    const onSubmit = async (data: StandForm2021Data) => {
        try {
            const formSubmission = await submitStandForm2021(data);

            if (formSubmission.success) {
                form.reset(); // Wipe the form data
                setCurrentStepIndex(0); // Go back to the starting state
                toast({
                    title: "2021 Stand Form Submitted! Thank you for the Scouting! GO YETI!!!!!!",
                    description: "Form data has been saved successfully",
                });
            } else {
                throw new Error(formSubmission.error);
            }
        } catch (error) { //error message for failed submission
            console.error("Form submission failed:", error);
            toast({
                title: "Form submission failed!",
                description: "Please try again",
                variant: "destructive",
            });
        }
    };

    const contextValue = {
        currentStepIndex,
        currentStep,
        goToNextStep,
        goToPreviousStep,
        canGoNext,
        canGoPrevious,
        isLastStep,
        isFirstStep,
        progress,
        submitForm: onSubmit,
        isSubmitting: form.formState.isSubmitting,
        formState: {
            errors: form.formState.errors,
            isDirty: form.formState.isDirty,
            isValid: form.formState.isValid,
        },
        standForm: {
            teams,
            setTeams,
        },
    };

    return (
        <ScoutForm2021Context.Provider value={contextValue}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>{children}</form>
            </Form>
        </ScoutForm2021Context.Provider>
    );
}

// NEEDS to be used within the StandForm2021Provider
export function useStandForm2021() {
    const context = useContext(ScoutForm2021Context);

    if (!context) { //error message for failed use if context is null
        throw new Error("useStandForm2021 must be used within a StandForm2021Provider");
    }

    return context;
}

