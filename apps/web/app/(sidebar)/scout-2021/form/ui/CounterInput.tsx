"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Minus, Plus } from "lucide-react";
import { ComponentProps } from "react";
import { useFormContext } from "react-hook-form";

//CounterInput component for the 2021 stand form
//provides the incrememnting and decrementing buttons for the form
//copied mostly from the 2025 standform and was slightly modified for the 2021 stand form

export function CounterInput({
    name,
    min,
    step,
    max,
    defaultValue,
    //this is the destructuring of the props for the component
}: {
    name: string;
    min?: number;
    step?: number;
    max?: number;
    defaultValue?: number;
    //this is the component props for the component
} & ComponentProps<typeof Input>) {
    const { setValue, watch } = useFormContext();
    const count = Number(watch(name) ?? defaultValue ?? 0);
    //this is the function that is used to increment the count so that the ticker works
    const handleIncrement = () => {
        if (!!max && count >= max) return;
        setValue(name, count + (step ?? 1), { shouldValidate: true });
    };

    const handleDecrement = () => {
        if (min !== undefined && count <= min) return;
        setValue(name, count - (step ?? 1), { shouldValidate: true });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        if (!isNaN(value)) {
            setValue(name, value, { shouldValidate: true });
        }
    };

    return (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-1">
            <Button
                className="aspect-square h-9 border-gray-600 hover:bg-gray-900/50"
                disabled={!!min && count <= min}
                onClick={handleDecrement}
                variant="outline"
                size="icon"
                type="button"
            >
                <Minus className="text-gray-400" />
            </Button>
            <Input
                className="h-9 w-full p-0 text-center select-none border-gray-600 focus:border-gray-400 bg-black"
                value={count}
                onChange={handleChange} //utilizing the handleChange function to change the count
                readOnly //making the input read only so that the user cannot change the value
                min={min} //setting the minimum value for the input
                max={max} //setting the maximum value for the input
                step={step} //setting the step value for the input
            />
            <Button
                disabled={max !== undefined && count >= max}
                onClick={handleIncrement} //utilizing the handleIncrement function to increment the count   
                variant="outline" //setting the variant for the button to outline
                size="icon" //setting the size for the button to icon
                type="button"
                className="aspect-square h-9 border-gray-600 hover:bg-gray-900/50" //setting the class name for the button
            >
                {/*sign for button, the plus sign*/}
                <Plus className="text-gray-400" />
            </Button>
        </div>
    );
}

