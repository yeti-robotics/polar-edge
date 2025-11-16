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

{/* Teleop tab of the stand form */ }
export function TeleopPeriod() {
    const form = useFormContext();

    return (
        <CardContent className="space-y-4">
            {/* Power Cells Tracking */}
            <PowerCellInput period="teleop" />

            {/* Intake Capability Tracking */}
            <FormField
                control={form.control}
                name="teleop.teleop_intake"
                render={({ field }) => (
                    <FormItem className="flex items-center gap-x-3">
                        <Checkbox
                            className="size-6 border-gray-600 data-[state=checked]:border-gray-400 data-[state=checked]:bg-transparent data-[state=checked]:text-gray-200"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        <FormLabel className="text-sm text-gray-300 !mt-0">
                            Can robot intake Power Cells?
                        </FormLabel>
                    </FormItem>
                )}
            />

            {/* Shooting Location Tracking */}
            <FormField
                control={form.control}
                name="teleop.teleop_shooting_location"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-200">Shooting Location</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <SelectTrigger className="border-gray-600 focus:border-gray-400 bg-black">
                                <SelectValue placeholder="Select shooting location" />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-gray-600">
                                <SelectItem value="protected" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Protected Zone
                                </SelectItem>
                                <SelectItem value="initiation" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Initiation Line
                                </SelectItem>
                                <SelectItem value="trench" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Trench
                                </SelectItem>
                                <SelectItem value="close" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Close
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />

            {/* How fast the robot cycle was, made through help with autocomplete as most of the data was already made before */}
            <FormField
                control={form.control}
                name="teleop.teleop_cycle_speed"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-200">Cycle Speed</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <SelectTrigger className="border-gray-600 focus:border-gray-400 bg-black">
                                <SelectValue placeholder="Select cycle speed" />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-gray-600">
                                <SelectItem value="fast" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Fast
                                </SelectItem>
                                <SelectItem value="medium" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Medium
                                </SelectItem>
                                <SelectItem value="slow" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Slow
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />

            {/* Defense Rating */}
            <FormField
                control={form.control}
                name="teleop.teleop_defense_rating"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-200">Defense Rating</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <SelectTrigger className="border-gray-600 focus:border-gray-400 bg-black">
                                <SelectValue placeholder="Select defense rating" />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-gray-600">
                                <SelectItem value="bad" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Bad
                                </SelectItem>
                                <SelectItem value="average" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Average
                                </SelectItem>
                                <SelectItem value="good" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Good
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />
        </CardContent>
    );
}

