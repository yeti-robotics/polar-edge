import { Binoculars } from "lucide-react";

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <Binoculars className="h-10 w-10 opacity-40" />
      <p className="text-sm">No {label} submitted yet.</p>
    </div>
  );
}
