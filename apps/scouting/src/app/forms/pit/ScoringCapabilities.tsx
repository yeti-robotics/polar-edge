import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

export function ScoringCapabilities() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg text-neutral-200">Scoring Capabilities</h2>
        <Input
          type="text"
          id="scoring-capabilities"
          name="scoring-capabilities"
          placeholder="Enter scoring capabilities"
        />
      </section>
    </div>
  );
}
