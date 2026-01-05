"use client";

import { getTeamsInMatch } from "../../actions/teamsInMatch";
import { useStandForm } from "../FormProvider";

import { useLoadingTime } from "@/lib/hooks/use-loading-time";
import { useIsOnline } from "@/lib/hooks/use-online-status";
import { toTitleCase } from "@/lib/utils";
import { Button } from "@repo/ui/components/button";
import { CardContent } from "@repo/ui/components/card";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { RefreshCcw } from "lucide-react";
import { useEffect, useTransition } from "react";
import { useFormContext } from "react-hook-form";

const DEFAULT_MATCH_LOAD_WAIT_TIME = 5000;

export function MatchDetail() {
	const form = useFormContext();
	const {
		standForm: { teams, setTeams },
	} = useStandForm();
	const [isPending, startTransition] = useTransition();

	const isOnline = useIsOnline();
	const { timedOut, startLoading, stopLoading } = useLoadingTime(
		DEFAULT_MATCH_LOAD_WAIT_TIME
	);

	const hasGoodInternet = isOnline && !timedOut;
	const hasTeams = !!teams.length;

	const teamNumber = form.watch("match_detail.team_number");
	const matchNumber = form.watch("match_detail.match_number");
	const isValidMatchNumber =
		!form.getFieldState("match_detail.match_number", form.formState)
			.invalid && parseInt(matchNumber) > 0;

	useEffect(() => {
		handleMatchNumberChange(matchNumber);
		// TODO: investigate if we can get around exhaustive deps here. Might require refactoring how we're handling the form state.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [matchNumber, isValidMatchNumber]);

	useEffect(() => {
		if (
			hasGoodInternet &&
			hasTeams &&
			!teams.some((t) => t.teamNumber == teamNumber)
		) {
			form.setValue("match_detail.team_number", "");
		}
		// TODO: investigate if we can get around exhaustive deps here. Might require refactoring how we're handling the form state.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [teamNumber, teams, hasGoodInternet]);

	const handleMatchNumberChange = (value: string) => {
		if (isValidMatchNumber) {
			startLoading();

			startTransition(async () => {
				const res = await getTeamsInMatch(parseInt(value));
				stopLoading();
				if (res.success) {
					setTeams(res.value);
				}
			});
		}
	};

	return (
		<CardContent className="space-y-4">
			<FormField
				control={form.control}
				name="match_detail.match_number"
				render={({ field }) => {
					const { onChange, ...fieldParams } = field;

					return (
						<FormItem>
							<FormLabel>Match Number</FormLabel>
							<FormControl>
								<Input
									autoComplete={"off"}
									placeholder="Number of match being played"
									onChange={(e) => {
										onChange(e);
										form.trigger(
											"match_detail.match_number"
										);
									}}
									{...fieldParams}
								/>
							</FormControl>
							<FormMessage className="text-xs" />
						</FormItem>
					);
				}}
			/>
			{isValidMatchNumber && (
				<FormField
					control={form.control}
					name="match_detail.team_number"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Team Number</FormLabel>
							{isPending && hasGoodInternet && !hasTeams && (
								<Skeleton className="h-10 w-full" />
							)}
							{hasTeams && (
								<Select
									onValueChange={field.onChange}
									defaultValue={""}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a team number" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{teams.map((team) => (
											<SelectItem
												key={team.teamNumber}
												value={team.teamNumber.toString()}
											>
												{`${team.teamNumber} - ${team.teamName} (${toTitleCase(team.alliance)} ${team.alliancePosition})`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
							{!isPending && !hasTeams && (
								<p className="text-muted-foreground mt-4 text-sm">
									No teams found for this match
								</p>
							)}
							<FormMessage className="text-xs" />
						</FormItem>
					)}
				/>
			)}
			{!hasGoodInternet && !hasTeams && isValidMatchNumber && (
				<div className="space-y-4">
					<div className="mb-4 text-xs text-red-500">
						{!isOnline
							? "No internet."
							: "Slow connection detected."}{" "}
						Cannot fetch match details. Please input manually.
					</div>
					<FormField
						control={form.control}
						name="match_detail.team_number"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Team Number</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage className="text-xs" />
							</FormItem>
						)}
					/>
					<Button
						type="button"
						variant="secondary"
						onClick={() => handleMatchNumberChange(matchNumber)}
					>
						Refetch match details <RefreshCcw />
					</Button>
				</div>
			)}
		</CardContent>
	);
}
