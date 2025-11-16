"use client";

import { CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/select";
import { useFormContext } from "react-hook-form";

//Control panel tab of the stand form
export function ControlPanel() {
    const form = useFormContext();
    //useFormContext is a react-hook that allows us to access the form context; same as every other file
    return (
        <CardContent className="space-y-4">
            {/* Control Panel Interaction */}
            <FormField
                control={form.control}
                name="control_panel.control_panel_interact"
                render={({ field }) => (
                    <FormItem className="flex items-center gap-x-3">
                        <Checkbox
                            className="size-6 border-gray-600 data-[state=checked]:border-gray-400 data-[state=checked]:bg-transparent data-[state=checked]:text-gray-200"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        <FormLabel className="text-sm text-gray-300 !mt-0">
                            Did robot interact with Control Panel?
                        </FormLabel>
                    </FormItem>
                )}
            />

            {/* Control Panel Stage */}
            <FormField
                control={form.control}
                name="control_panel.control_panel_stage"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-200">Stage Completed</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <SelectTrigger className="border-gray-600 focus:border-gray-400 bg-black">
                                <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-gray-600">
                                <SelectItem value="none" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    None
                                </SelectItem>
                                <SelectItem value="rotation" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Rotation Control (3-5 rotations)
                                </SelectItem>
                                <SelectItem value="position" className="hover:bg-gray-900/50 focus:bg-gray-900/50">
                                    Position Control (specific color)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />

            {/* Control Panel Notes */}
            <FormField
                control={form.control}
                name="control_panel.control_panel_notes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-200">Notes (Optional)</FormLabel>
                        <Input
                            className="border-gray-600 focus:border-gray-400 bg-black"
                            placeholder="Control panel performance notes..."
                            {...field}
                        />
                    </FormItem>
                )}
            />

            {/* Info Box */}
            <div className="bg-transparent border border-gray-700 rounded-md p-3">
                <p className="text-xs text-gray-300">
                    <span className="text-gray-100 font-bold">Rotation Control:</span> Spin 3-5 times (10 pts)
                </p>
                <p className="text-xs text-gray-300 mt-1">
                    <span className="text-gray-100 font-bold">Position Control:</span> Align to specific color (20 pts)
                </p>
            </div>
        </CardContent>
    );
}

