import Link from "next/link";

export default function ScoutingDashboard({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div className="grid grid-cols-[220px_1fr] h-[calc(100vh-64px)]">
        <aside className="sticky top-0 border-r">
          <div className="flex flex-col gap-2 p-5">
            <span className="text-xs text-muted-foreground uppercase font-mono">Scouting Data</span>
            <Link className="text-sm" href="/data">
              Data
            </Link>
            <Link className="text-sm" href="/data/graphs">
              Graph
            </Link>
          </div>
        </aside>
        {children}
      </div>
    </section>
  );
}
