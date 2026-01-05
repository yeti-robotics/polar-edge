"use client";
import { Cage } from "@/lib/database/schema";
import { CardContent } from "@repo/ui/components/card";
import { FormField } from "@repo/ui/components/form";
import { FormItem } from "@repo/ui/components/form";
import { FormLabel } from "@repo/ui/components/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useFormContext } from "react-hook-form";

export function Endgame() {
	const form = useFormContext();

	return (
		<CardContent>
			<FormField
				control={form.control}
				name="endgame.cage_climb"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Endgame State</FormLabel>
						<Select
							onValueChange={field.onChange}
							defaultValue={field.value}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a cage climb" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={Cage.NONE}>
									No Endgame State
								</SelectItem>
								<SelectItem value={Cage.PARK}>
									Parked
								</SelectItem>
								<SelectItem value={Cage.SHALLOW}>
									Shallow Climb
								</SelectItem>
								<SelectItem value={Cage.DEEP}>
									Deep Climb
								</SelectItem>
							</SelectContent>
						</Select>
					</FormItem>
				)}
			/>
		</CardContent>
	);
}
