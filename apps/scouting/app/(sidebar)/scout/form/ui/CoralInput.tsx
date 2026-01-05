import { CounterInput } from "./CounterInput";
import { ReefDiagram } from "./Reef";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@repo/ui/components/dialog";
import { FormField } from "@repo/ui/components/form";
import { FormItem } from "@repo/ui/components/form";
import { FormLabel } from "@repo/ui/components/form";
import { Cylinder } from "lucide-react";
import { useFormContext } from "react-hook-form";

/**
 * CoralInput component provides a dialog interface for inputting coral-related data
 * in both autonomous and teleop periods. It uses a dialog to display input fields
 * for different coral levels (trough, low, mid, high).
 *
 * The component integrates with the form schema defined in ../data/schema.ts,
 * which validates coral inputs as non-negative integers for each level and period.
 *
 * @component
 * @example
 * ```tsx
 * <CoralInput period="auto" />
 * ```
 */

const levelMap = {
	1: "Trough",
	2: "Low",
	3: "Mid",
	4: "High",
};

export function CoralInput({ period }: { period: "auto" | "teleop" }) {
	const form = useFormContext();
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					className="flex aspect-square h-auto flex-col [&_svg]:size-8"
					variant="outline"
				>
					<Cylinder className="" />
					Coral
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-scroll">
				<DialogHeader>
					<DialogTitle>
						{period === "auto" ? "Auto" : "Teleop"} Coral Input
					</DialogTitle>
					<DialogDescription className="sr-only">
						Enter the amount of coral collected in each level.
					</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-4 overflow-scroll">
					<ReefDiagram className="fill-primary h-[380px] max-h-[50vh] w-full" />
					<div className="flex flex-col justify-between">
						{([4, 3, 2, 1] as const).map((level) => (
							<FormField
								key={level}
								control={form.control}
								name={`${period}.${period}_coral_level_${level}`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{levelMap[level]}</FormLabel>
										<CounterInput min={0} {...field} />
									</FormItem>
								)}
							/>
						))}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
