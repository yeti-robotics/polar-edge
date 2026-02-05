import { Input } from "@repo/ui/components/input";

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
//add capacity how many balls can be stored
//climb type (where on the tower can they climb)
//shuttle capability (if applicable) (and where they can shuttle from, like neutral zone, or other teams section)
//timestamps (when they start shooting, when they end, cycle speed) (This is more like a standform type of thing anyways)
//their team number (added this in pitform page)
//scout member id
