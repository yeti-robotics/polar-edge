import { TypographyH1, TypographyH3, TypographyMuted } from "@repo/ui/components/typography";
import Link from "next/link";
import { routes } from "@/lib/routes";

export default function FormsPage() {
  return (
    <div>
      <TypographyH1 className="mb-1">Forms</TypographyH1>
      <TypographyMuted className="mb-6">Select a form to get started.</TypographyMuted>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Link
          href={routes.forms.stand}
          className="border rounded-lg p-4 hover:bg-muted transition-colors"
        >
          <TypographyH3>Stand Form</TypographyH3>
          <TypographyMuted>Match scouting during play</TypographyMuted>
        </Link>
        <Link
          href={routes.forms.pit}
          className="border rounded-lg p-4 hover:bg-muted transition-colors"
        >
          <TypographyH3>Pit Form</TypographyH3>
          <TypographyMuted>Robot details and capabilities</TypographyMuted>
        </Link>
      </div>
    </div>
  );
}
