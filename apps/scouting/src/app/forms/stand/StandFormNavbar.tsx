import Link from "next/link";
export function FormSidebar() {
  return (
    <aside className="sticky top-0 border-r z-40">
      <div className="flex flex-col gap-2 p-4">
        <span className="text-xs·text-muted-foreground·uppercase·font-mono">Form Hub</span>
        <Link className="text-sm" href="/forms/pit">
          Pit Form
        </Link>
        <Link className="text-sm" href="/forms/stand">
          {/* It will eventually be the stand form page for now this is empty */}
          Stand Form
        </Link>
      </div>
    </aside>
  );
}
