"use client";

import React, { useState } from "react";
import { CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { FormField, FormItem, FormLabel } from "@repo/ui/components/form";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@repo/ui/components/select'

import { useForm, FormProvider, useFormContext } from "react-hook-form";

export function Auto() {
    const form = useFormContext();
    const [autoData, setAutoData] = useState()

    return (
        <CardContent className="space-y-5">
            <FormField

                name="Auto"


    )








//     return (
//         <CardContent>
//             <FormField
//                 control={form.control}
//                 name="auto"
//                 render={({ field }) => (
//                     <FormItem className="flex flex-row items-center justify-start space-x-3 space-y-0">
//                         <FormField>
//                             <Checkbox
//                                 checked={field.value}
//                                 onCheckedChange={field.onChange}
//                             />
//                         </FormField>
//                         <div className="space-y-1 leading-none">
//                             <FormLabel>Auto</FormLabel>
//                             <p className="text-sm text-muted-foreground">
//                                 Auto
//                             </p>
//                         </div>
//                     </FormItem>
//                 )}
//             />
//         </CardContent>
//     );

// };