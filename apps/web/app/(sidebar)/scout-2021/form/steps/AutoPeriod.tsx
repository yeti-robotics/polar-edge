"use client";

import { PowerCellInput } from "../ui/PowerCellInput";

import { CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/select";
import { useFormContext } from "react-hook-form";

//Auto tab of the stand form
export function AutoPeriod() {
    const form = useFormContext();
    //useFormContext is a react-hook that allows us to access the form context; same as every other file
    return (
        <CardContent className="space-y-4">
            {/* Starting Position */}
            <FormField
                control={form.control}
                name="auto.auto_starting_position"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-200">Starting Position</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <SelectTrigger className="border-gray-600 focus:border-gray-400 bg-black">
                                <SelectValue placeholder="Select starting position" />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-gray-600">
                                <SelectItem value="front" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Front of Target Zone
                                </SelectItem>
                                <SelectItem value="trench" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Trench
                                </SelectItem>
                                <SelectItem value="other" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Other
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />

            {/*Power cells input*/}
            <div className="grid gap-4 min-[375px]:grid-cols-1">
                <PowerCellInput period="auto" />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
                <FormField
                    control={form.control}
                    name="auto.auto_left_initiation_line"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-x-3">
                            <Checkbox
                                className="size-6 border-gray-600 data-[state=checked]:border-gray-400 data-[state=checked]:bg-transparent data-[state=checked]:text-gray-200"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            <FormLabel className="text-sm text-gray-300 !mt-0">
                                Moved off initiation line? (5 pts)
                            </FormLabel>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="auto.auto_worked"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-x-3">
                            <Checkbox
                                className="size-6 border-gray-600 data-[state=checked]:border-gray-400 data-[state=checked]:bg-transparent data-[state=checked]:text-gray-200"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            <FormLabel className="text-sm text-gray-300 !mt-0">
                                Did autonomous work correctly?
                            </FormLabel>
                        </FormItem>
                    )}
                />
            </div>
        </CardContent>
    );
}

