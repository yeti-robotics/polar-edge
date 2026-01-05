"use client";

import { setCurrentEvent } from "./actions";

import { Button } from "@repo/ui/components/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@repo/ui/components/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { cn } from "@repo/ui/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

export function EventSelector({
	events,
}: {
	events: { id: string; name: string; isCurrent: boolean }[];
}) {
	const [open, setOpen] = React.useState(false);
	const [value, setValue] = React.useState(
		events.find((event) => event.isCurrent)?.id
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full max-w-xs justify-between"
				>
					{value
						? events.find((event) => event.id === value)?.name
						: "Select event..."}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-xs p-0">
				<Command>
					<CommandInput placeholder="Search event..." />
					<CommandList>
						<CommandEmpty>No event found.</CommandEmpty>
						<CommandGroup>
							{events.map((event) => (
								<CommandItem
									className="max-w-xs cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
									key={event.id}
									value={event.id}
									onSelect={(currentValue) => {
										setValue(currentValue);
										setOpen(false);
										setCurrentEvent(currentValue);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											event.isCurrent
												? "opacity-100"
												: "opacity-0"
										)}
									/>
									{event.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
