"use client";

import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

//move all the useStates to the Pitform.tsx

export function PitForm() {
  //going to use the Card component in page.tsx to wrap this form (got rid of it here, so that I can make it like 2 pages better)
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg text-neutral-200">Team Number</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
        <Input
          type="number"
          id="team_number"
          name="team_number"
          placeholder="Enter Team Number"
        ></Input>
      </section>
      <section>
        <h2 className="text-lg text-neutral-200">Scout Member ID</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
        <Input
          type="number"
          id="scout_member_id"
          name="scout_member_id"
          placeholder="Enter Scout Member ID"
        ></Input>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg text-neutral-200">Robot Dimensions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="width">Width</Label>
            <Input type="number" id="width" name="width" placeholder="Enter width" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="length">Length</Label>
            <Input type="number" id="length" name="length" placeholder="Enter length" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="weight">Weight</Label>
            <Input type="number" id="weight" name="weight" placeholder="Enter weight" />
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg text-neutral-200">Final Climb Level</h2>
        <div className="flex gap-6">
          {["L1", "L2", "L3"].map((level) => (
            <Label key={level} htmlFor={`climb-${level}`}>
              <Checkbox id={`climb_${level}`} name={`climb-${level}`} value={level} />
              {level}
            </Label>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg text-neutral-200">Robot Driving Ability</h2>
        <div className="flex gap-6">
          {["Bump", "Trench"].map((type) => (
            <Label key={type} htmlFor={`build-${type}`}>
              <Checkbox id={`build_${type}`} name={`build-${type}`} value={type} />
              {type}
            </Label>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg text-neutral-200">Drivetrain Type</h2>
        <div className="flex gap-8">
          {["Tank", "Mecanum", "Swerve", "Other"].map((type) => (
            <Label key={type} htmlFor={`drivetrain-${type}`}>
              <Checkbox id={`drivetrain_${type}`} name={`drivetrain-${type}`} value={type} />
              {type}
            </Label>
          ))}
        </div>
      </section>
    </div>
  );
}
