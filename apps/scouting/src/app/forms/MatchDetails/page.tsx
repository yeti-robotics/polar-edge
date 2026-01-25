"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { LayersIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function FindMatchPopUp() {
  // this state allwos the pop up to exit and open and exit and open after clicking onto the submit button
  const [open, setOpen] = useState(true);

  //this allows me to reload and make sure the component doesnt disapear weirdly after clicking submit chatgpt helped me a little bit to understand this component
  useEffect(() => {
    setOpen(true);
  }, []);

  //ik this hook takes two arguments the second one is the dpeendices and we have none here so just leaving a []

  if (!open) {
    return null;
  }
  // i think the if statment above can be changed to show something else after submission probably redirecting into the standform or so

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-[90vw] max-w-sm p-6 space-y-6">
        <h2 className="flex items-center justify-center gap-2 text-xl font-bold mb-2">
          <LayersIcon className="h-5 w-5" />
          Match and Team Details
        </h2>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg text-neutral-200">Match Number</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
          <Input
            type="number"
            id="match_number"
            name="match_number"
            placeholder="Enter Match Number"
          />
        </section>
        <section>
          <h2 className="text-lg text-neutral-200 mb-3 flex-11"> Team Number</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 -p-10"></div>

          <Input id="team_numberid" name="team_number_id" placeholder="Enter Team Number" />
          {/* thi should be a drop down later  */}
        </section>

        {/*  this is for submitting the form after this users move on to the actual form and carry on */}
        <section className="flex justify-end items-end">
          <Button onClick={() => setOpen(false)}>Submit</Button>
        </section>
      </Card>
    </div>
  );
}
