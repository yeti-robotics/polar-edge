"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Search } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface Event {
	id: string;
	name: string;
	isCurrent: boolean;
}

interface TeamSearchProps {
	events: Event[];
}

export function TeamSearch({ events }: TeamSearchProps) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState(
		searchParams.get("search") ?? ""
	);
	const [selectedEvent, setSelectedEvent] = useState(
		searchParams.get("eventId") ?? ""
	);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const params = new URLSearchParams(searchParams);
		if (searchTerm) {
			params.set("search", searchTerm);
		} else {
			params.delete("search");
		}
		if (selectedEvent) {
			params.set("eventId", selectedEvent);
		} else {
			params.delete("eventId");
		}
		params.set("page", "1"); // Reset to first page on new search
		router.push(`/admin/teams?${params.toString()}`);
	};

	const handleEventChange = (value: string) => {
		const newValue = value === selectedEvent ? "" : value;
		setSelectedEvent(newValue);
		const params = new URLSearchParams(searchParams);
		if (newValue !== "all") {
			params.set("eventId", newValue);
		} else {
			params.delete("eventId");
		}
		params.set("page", "1");
		router.push(`/admin/teams?${params.toString()}`);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex max-w-3xl flex-col gap-2 sm:flex-row"
		>
			<div className="relative flex w-full">
				<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					placeholder="Search teams..."
					className="pl-9"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>
			<div className="flex w-full gap-4">
				<Select
					defaultValue={selectedEvent}
					value={selectedEvent}
					onValueChange={handleEventChange}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All Events" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Events</SelectItem>
						{events.map((event) => (
							<SelectItem
								key={event.id}
								value={event.id}
								className="group flex items-center justify-between"
							>
								<span>{event.name}</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button type="submit" className="shrink-0">
					Search
				</Button>
			</div>
		</form>
	);
}
