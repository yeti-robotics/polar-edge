"use client";

import { CardContent } from "@repo/ui/components/card";
import {
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@repo/ui/components/form";
import { Textarea } from "@repo/ui/components/textarea";
import { useFormContext } from "react-hook-form";

//Miscellaneous tab of the stand form
export function Miscellaneous() {
    const form = useFormContext(); //useFormContext is a react-hook that allows us to access the form context
    return (
        <CardContent className="space-y-4">
            <FormField
                control={form.control}
                name="misc.final_comments"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-200">Final Comments</FormLabel>
                        <Textarea
                            className="border-gray-600 focus:border-gray-400 bg-black min-h-[150px]"
                            placeholder="Describe overall robot performance, strengths, weaknesses, and any notable observations..."
                            {...field}
                        />
                        <FormMessage className="text-xs" />
                        <p className="text-xs text-gray-400">
                            Minimum 32 characters required. Current: {field.value?.length || 0}
                        </p>
                    </FormItem>
                )}
            />

            {/* The information box for the final comments that the user can add, same exact things as the 2025 reefscape comments  */}
            <div className="bg-transparent border border-gray-700 rounded-md p-3">
                <p className="text-xs text-gray-300">
                    <span className="text-gray-100 font-bold">What to include:</span>
                </p>
                <ul className="text-xs text-gray-300 mt-1 space-y-1 list-disc list-inside">
                    <li>Robot reliability and consistency</li>
                    <li>Driver skill and strategy</li>
                    <li>Mechanical issues or breakdowns</li>
                    <li>Standout capabilities</li>
                    <li>Alliance compatibility</li>
                </ul>
            </div>
        </CardContent>
    );
}

