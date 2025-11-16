import { CounterInput } from "./CounterInput";

import { Button } from "@repo/ui/components/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/dialog";
import { FormField } from "@repo/ui/components/form";
import { FormItem } from "@repo/ui/components/form";
import { FormLabel } from "@repo/ui/components/form";
import { Circle } from "lucide-react";
import Image from "next/image";
import { useFormContext } from "react-hook-form";

//PowerCellInput component for the 2021 stand form
//provides a dialog interface for inputting Power Cells scored in the three different goals
//similar to CoralInput from 2025, but adapted for the 2021 game

export function PowerCellInput({ period }: { period: "auto" | "teleop" }) {
    const form = useFormContext();
    const periodPrefix = period === "auto" ? "auto" : "teleop";
    //this is the prefix for the period, auto or teleop
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button //this is the button that is used to trigger the dialog
                    className="flex aspect-square h-auto flex-col border-red-800 bg-black hover:border-red-600 hover:bg-red-950/30"
                    variant="outline" //this is the variant for the button, outline
                >
                    <Image
                        src="/2021ScoutFirstOrder.png"
                        alt="Scout First Order Logo"
                        width={100}
                        height={100}
                        className="object-contain"
                    />
                    <span className="text-red-500">Power Cells</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-scroll border-2 border-red-900 bg-black">
                <DialogHeader>
                    <DialogTitle className="text-red-500">
                        {period === "auto" ? "Autonomous" : "Teleop"} Power Cells
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Enter the number of Power Cells scored in each goal.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 overflow-scroll">
                    <div className="relative h-[380px] max-h-[50vh] w-full rounded-lg overflow-hidden border-2 border-red-900 bg-black">
                        <Image //used Image instead of img tag so that the image can be responsive and the size can be adjusted to the container and image is more clear
                            src="/2021-field-diagram.png" //This is where I was able to gather the image of the powerport similar to how we had an image of the coral so that user's can easily see what section is being scouted
                            alt="2021 Infinite Recharge Field Diagram"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div className="flex flex-col justify-between gap-4">
                        {/* Inner Port */}
                        <FormField
                            control={form.control}
                            name={`${period}.${periodPrefix}_power_cells_inner`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-200">
                                        Inner Port (Top)
                                    </FormLabel>
                                    <CounterInput min={0} {...field} />
                                </FormItem>
                            )}
                        />

                        {/* Outer Port */}
                        <FormField
                            control={form.control}
                            name={`${period}.${periodPrefix}_power_cells_outer`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-200">
                                        Outer Port (Ring)
                                    </FormLabel>
                                    <CounterInput min={0} {...field} />
                                </FormItem>
                            )}
                        />

                        {/* Lower Port */}
                        <FormField
                            control={form.control}
                            name={`${period}.${periodPrefix}_power_cells_lower`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-200">
                                        Lower Port (Bottom) {/*this is the label for the lower port for readability, it is the same thing as the other levels essentially*/}
                                    </FormLabel>
                                    <CounterInput min={0} {...field} />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

