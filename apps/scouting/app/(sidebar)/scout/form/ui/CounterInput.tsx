"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Minus, Plus } from "lucide-react";
import { ComponentProps } from "react";
import { useFormContext } from "react-hook-form";

/**
 * CounterInput component provides a counter input field for form data.
 * It uses the `useFormContext` hook to register the input field with the form.
 *
 * @component
 * @example
 * ```tsx
 * <CounterInput name="counter" />
 * ```
 */
export function CounterInput({
	name,
	min,
	step,
	max,
	defaultValue,
}: {
	name: string;
	min?: number;
	step?: number;
	max?: number;
	defaultValue?: number;
} & ComponentProps<typeof Input>) {
	const { setValue, watch } = useFormContext();
	const count = Number(watch(name) ?? defaultValue ?? 0);

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
				className="aspect-square h-9"
				disabled={!!min && count <= min}
				onClick={handleDecrement}
				variant="outline"
				size="icon"
				type="button"
			>
				<Minus />
			</Button>
			<Input
				className="h-9 w-full p-0 text-center select-none"
				value={count}
				onChange={handleChange}
				readOnly
				min={min}
				max={max}
				step={step}
			/>
			<Button
				disabled={max !== undefined && count >= max}
				onClick={handleIncrement}
				variant="outline"
				size="icon"
				type="button"
				className="aspect-square h-9"
			>
				<Plus />
			</Button>
		</div>
	);
}
