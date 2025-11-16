"use client";

import { CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useFormContext } from "react-hook-form";

//Endgame tab of the stand form
export function Endgame() {
    const form = useFormContext();
    //useFormContext is a react-hook that allows us to access the form context; same as every other file
    return (
        <CardContent className="space-y-4">
            {/* Climb Checkboxes */}
            <div className="space-y-3">
                <FormField
                    control={form.control}
                    name="endgame.endgame_attempted_climb"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-x-3">
                            <Checkbox
                                className="size-6 border-gray-600 data-[state=checked]:border-gray-400 data-[state=checked]:bg-transparent data-[state=checked]:text-gray-200"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            <FormLabel className="text-sm text-gray-300 !mt-0">
                                Attempted to climb on generator switch?
                            </FormLabel>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="endgame.endgame_successful_climb"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-x-3">
                            <Checkbox
                                className="size-6 border-gray-600 data-[state=checked]:border-gray-400 data-[state=checked]:bg-transparent data-[state=checked]:text-gray-200"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            <FormLabel className="text-sm text-gray-300 !mt-0">
                                Successful climb? (fully supported)
                            </FormLabel>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="endgame.endgame_switch_balanced"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-x-3">
                            <Checkbox
                                className="size-6 border-gray-600 data-[state=checked]:border-gray-400 data-[state=checked]:bg-transparent data-[state=checked]:text-gray-200"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            <FormLabel className="text-sm text-gray-300 !mt-0">
                                Was the generator switch balanced?
                            </FormLabel>
                        </FormItem>
                    )}
                />
            </div>

            {/* Endgame Comments */}
            <FormField
                control={form.control}
                name="endgame.endgame_comments"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-200">Comments (Optional)</FormLabel>
                        <Input
                            className="border-gray-600 focus:border-gray-400 bg-black"
                            placeholder="Endgame performance notes..."
                            {...field}
                        />
                    </FormItem>
                )}
            />

            {/* Info Box */}
            <div className="bg-transparent border border-gray-700 rounded-md p-3">
                <p className="text-xs text-gray-300">
                    <span className="text-gray-100 font-bold">Endgame Scoring:</span>
                </p>
                <ul className="text-xs text-gray-300 mt-1 space-y-1 list-disc list-inside">
                    <li>Park: 5 points</li>
                    <li>Climb: 25 points</li>
                    <li>Balanced (multiple robots): +15 points</li>
                </ul>
            </div>
        </CardContent>
    );
}

