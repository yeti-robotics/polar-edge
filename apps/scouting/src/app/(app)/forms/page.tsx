import Link from "next/link";
import { routes } from "@/lib/routes";

export default function FormsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Forms</h1>
      <p className="text-muted-foreground mb-6">Select a form to get started.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Link
          href={routes.forms.stand}
          className="border rounded-lg p-4 hover:bg-muted transition-colors"
        >
          <p className="font-medium">Stand Form</p>
          <p className="text-sm text-muted-foreground">Match scouting during play</p>
        </Link>
        <Link
          href={routes.forms.pit}
          className="border rounded-lg p-4 hover:bg-muted transition-colors"
        >
          <p className="font-medium">Pit Form</p>
          <p className="text-sm text-muted-foreground">Robot details and capabilities</p>
        </Link>
      </div>
    </div>
  );
}
