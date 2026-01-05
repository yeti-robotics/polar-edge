"use client";

import { CoralInput } from "../ui/CoralInput";
import { CounterInput } from "../ui/CounterInput";

import { CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import { useFormContext } from "react-hook-form";

export function AutoPeriod() {
	const form = useFormContext();

	return (
		<CardContent>
			<FormField
				control={form.control}
				name="auto.auto_initiation_line"
				render={({ field }) => (
					<FormItem className="mb-2 flex items-center gap-x-2">
						<Checkbox
							className="mb-0 size-6"
							checked={field.value}
							onCheckedChange={field.onChange}
						/>
						<FormLabel className="flex items-center gap-2 text-sm">
							Moved off black line?
						</FormLabel>
					</FormItem>
				)}
			/>
			<div className="grid gap-4 min-[375px]:grid-cols-2">
				<CoralInput period="auto" />
				<div>
					<FormField
						control={form.control}
						name="auto.auto_algae_processed"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">
									Processor
								</FormLabel>
								<CounterInput min={0} {...field} />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="auto.auto_algae_netted"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">Barge</FormLabel>
								<CounterInput min={0} {...field} />
							</FormItem>
						)}
					/>
				</div>
			</div>
		</CardContent>
	);
}
