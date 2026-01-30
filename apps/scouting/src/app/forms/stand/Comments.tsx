import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

export default function AfterSubmitComment() {
  return (
    <section className="space-y-4 -mt-5">
      <h2 className="text-xl text-neutral-200">Comments</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 -mt-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="comments">Any Comments From the Match</Label>
          <Input type="text" id="comments" name="comments" placeholder="Enter Comments" />
        </div>
      </div>
    </section>
  );
}
