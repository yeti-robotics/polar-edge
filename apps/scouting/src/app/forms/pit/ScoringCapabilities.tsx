import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

export function ScoringCapabilities() {
  <Card>
    <form action="">
      <section className="space-y-3">
        <h2 className="text-lg text-neutral-200">Drivetrain Type</h2>
        <div className="flex gap-6">
          {["Tank", "Mecanum", "Swerve", "Other"].map((type) => (
            <Label key={type}>
              <input type="checkbox" name="drivetrain" value={type} />
              {type}
            </Label>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg text-neutral-200">Scoring Capabilities</h2>
        <Input
          type="text"
          id="scoring-capabilities"
          name="scoring-capabilities"
          placeholder="Enter scoring capabilities"
        />
      </section>
    </form>
  </Card>;
}
