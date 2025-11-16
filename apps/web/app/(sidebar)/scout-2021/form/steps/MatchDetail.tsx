"use client";

import { getTeamsInMatch } from "../../actions/teamsInMatch";
import { useStandForm2021 } from "../FormProvider";

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

//Match Details are displayed using this, that is the reason for the amount of imports, and code needing to be displayed 
//all data is displayed using this, and the data is displayed in the form
//useFormContext is a react-hook that allows us to access the form context; same as every other file
export function MatchDetail() { //this is the function that is exported to the form
    const form = useFormContext();
    const {
        standForm: { teams, setTeams },
    } = useStandForm2021(); //this is the hook that is used to get the teams and set the teams
    const [isPending, startTransition] = useTransition(); //this is the hook that is used to start the transition

    const isOnline = useIsOnline(); //this is the hook that is used to check if the user is online
    const { timedOut, startLoading, stopLoading } = useLoadingTime(
        DEFAULT_MATCH_LOAD_WAIT_TIME //this is the time that the user has to wait for the match details to load
    );

    const hasGoodInternet = isOnline && !timedOut;
    const hasTeams = !!teams.length;

    const teamNumber = form.watch("match_detail.team_number"); //this is the hook that is used to watch the team number
    const matchNumber = form.watch("match_detail.match_number"); //this is the hook that is used to watch the match number
    const isValidMatchNumber = //this is the function that is used to check if the match number is valid
        !form.getFieldState("match_detail.match_number", form.formState)
            .invalid && parseInt(matchNumber) > 0;

    useEffect(() => { //data fetching for the match details basically with the useEffect hook
        handleMatchNumberChange(matchNumber); //this is the function that is used to handle the match number change
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamNumber, teams, hasGoodInternet]);

    const handleMatchNumberChange = (value: string) => {
        if (isValidMatchNumber) {
            startLoading();

            startTransition(async () => {
                const res = await getTeamsInMatch(parseInt(value));
                stopLoading();
                if (res.success) {
                    setTeams(res.value ?? []);
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
                            <FormLabel className="text-gray-200">Match Number</FormLabel>
                            <FormControl>
                                <Input
                                    className="border-gray-600 focus:border-gray-400 bg-black"
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
                            <FormLabel className="text-gray-200">Team Number</FormLabel>
                            {isPending && hasGoodInternet && !hasTeams && (
                                <Skeleton className="h-10 w-full bg-gray-800" />
                            )}
                            {hasTeams && (
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={""}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="border-gray-600 focus:border-gray-400 bg-black">
                                            <SelectValue placeholder="Select a team number" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-black border-gray-600">
                                        {teams.map((team) => (
                                            <SelectItem
                                                key={team.teamNumber}
                                                value={team.teamNumber.toString()}
                                                className="hover:bg-gray-900/50 focus:bg-gray-900/50"
                                            >
                                                {`${team.teamNumber} - ${team.teamName} (${toTitleCase(team.alliance)} ${team.alliancePosition})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {!isPending && !hasTeams && (
                                <p className="text-gray-400 mt-4 text-sm">
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
                    <div className="mb-4 text-xs text-gray-400">
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
                                <FormLabel className="text-gray-200">Team Number</FormLabel>
                                <FormControl>
                                    <Input
                                        className="border-gray-600 focus:border-gray-400 bg-black"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleMatchNumberChange(matchNumber)}
                        className="border border-red-800 hover:border-red-600 bg-transparent text-red-500 hover:bg-red-950/30"
                    >
                        Refetch match details <RefreshCcw />
                    </Button>
                </div>
            )}
        </CardContent>
    );
}

