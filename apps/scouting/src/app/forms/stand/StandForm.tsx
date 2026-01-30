"use client";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Layers2Icon, MagnetIcon } from "lucide-react";
import { StandFormActionTypes, useStandForm } from "./StandFormProvider";
import StartTimer from "./Timer";

export function StandForm() {
  //going to use the Card component in page.tsx to wrap this form (got rid of it here, so that I can make it like 2 pages better)
  const {
    state: { isOofed },
    dispatch,
  } = useStandForm();
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg text-neutral-200">
          <MagnetIcon /> Match Number
        </h2>

        <pre>Oofed State: {String(isOofed)}</pre>
        <Button onClick={() => dispatch({ type: StandFormActionTypes.OOF_START })}>Start</Button>
        <Button onClick={() => dispatch({ type: StandFormActionTypes.OOF_END })}>End</Button>

        <Input
          type="number"
          id="match_number"
          name="match_number"
          placeholder="Enter Match Number"
          className="mt-1"
        />
        <h2 className="text-lg text-neutral-200 mt-3">
          <Layers2Icon /> Enter Team Number
        </h2>
        {/* this will become a drop down after users make a choice on the match number so users have options and have less on plate  */}
        <Input type="number" id="team_number" name="team_number" placeholder="Enter Team Number" />
      </section>

      <section className="space-y-4">
        <StartTimer />

        <div className="container justify-center align-middle">
          <Label className="text-2xl font-mono"> Climb Level </Label>
          <br />
          <Label className="gap-3">
            One <Checkbox />
          </Label>
          <Label>
            Two <Checkbox />
          </Label>
          <Label>
            Three
            <Checkbox />
          </Label>
        </div>
        <div>
          <p> NEXT SECTION </p>
        </div>
      </section>

      {/* this si for comments below at the end of the game this should shwo up after users submit their form 
       <section className="space-y-4 -mt-5">
        <h2 className="text-xl text-neutral-200">Comments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 -mt-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="comments">Any Comments From the Match</Label>
            <Input type="text" id="comments" name="comments" placeholder="Enter Comments" />
          </div>
        </div>
      </section>
      */}
    </div>
  );
}
