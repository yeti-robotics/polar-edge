"use client";

import { useStandForm2021 } from "./FormProvider";

import { Progress } from "@repo/ui/components/progress";

//Shows the progress of the form, same thing as reefscape
export function FormProgress() {
    const { progress } = useStandForm2021();

    return (
        <Progress //simple progress bar tag
            className="rounded-none bg-gray-900 h-2 [&>*]:bg-gray-500"
            value={progress}
        />
    );
}

