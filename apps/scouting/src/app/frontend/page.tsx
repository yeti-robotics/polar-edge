"use client";
import PitForm from "@/components/PitForms";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { FormField, FormItem, FormLabel} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@repo/ui/components/select";
import { useFormContext} from "react-hook-form";
import Folder from "@/components/Folder";


export default function FrontendOnlyForm() {
  return (
        <div className="flex justify-center p-4 justify-content: center;">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center" >
            Scouting Form
          </CardTitle>
        </CardHeader>

        <CardContent>
          <PitForm />
        </CardContent>
      </Card>
     
          

        
    </div>

  );
}