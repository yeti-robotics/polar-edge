"use client";

import { CardContent } from "@repo/ui/components/card";
import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { useFormContext } from "react-hook-form";

export function Miscellaneous() {
	const form = useFormContext();

	return (
		<div>
			<CardContent>
				<FormField
					control={form.control}
					name="misc.defense_rating"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Defense Rating</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a defense rating" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">1 - Bad</SelectItem>
									<SelectItem value="2">2 - Poor</SelectItem>
									<SelectItem value="3">
										3 - Average
									</SelectItem>
									<SelectItem value="4">4 - Good</SelectItem>
									<SelectItem value="5">
										5 - Excellent
									</SelectItem>
								</SelectContent>
							</Select>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="misc.comments"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Comments</FormLabel>
							<Textarea {...field} />
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</div>
	);
}
