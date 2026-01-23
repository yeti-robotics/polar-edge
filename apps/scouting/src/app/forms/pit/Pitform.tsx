import { Card } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Check } from "lucide-react";

export function PitForm() {
  return (
    <Card className="p-6">
      <form className="space-y-6 ">
        <section className="space-y-4">
          <h2 className="text-lg text-neutral-200  ">Robot Dimensions</h2>

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
              <Label htmlFor="height">Height</Label>
              <Input type="number" id="height" name="height" placeholder="Enter height" />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="weight">Weight</Label>
              <Input type="number" id="weight" name="weight" placeholder="Enter weight" />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg text-neutral-200">Climb Level</h2>

          <div className="flex gap-6">
            {["L1", "L2", "L3"].map((level) => (
              <Label key={level} htmlFor={`climb-${level}`}>
                <Checkbox id={`climb-${level}`} value={level} />
                {level}
              </Label>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg text-neutral-200">Robot Build</h2>

          <div className="flex gap-6">
            {["Bump", "Trench"].map((type) => (
              <Label key={type}>
                <Checkbox id={`build-${type}`} name="build" value={type} />
                {type}
              </Label>
            ))}
          </div>
        </section>
      </form>
    </Card>
  );
}
