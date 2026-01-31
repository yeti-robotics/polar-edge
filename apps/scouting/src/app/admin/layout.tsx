import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[220px_1fr] h-[calc(100vh-64px)] ">
      <aside className="sticky top-0 border-r z-40">
        <div className="flex flex-col gap-2 p-4">
          <span className="text-xs text-muted-foreground uppercase font-mono">Admin Hub</span>
          <Link className="text-sm" href="/admin/members">
            Members
          </Link>
          <Link className="text-sm" href="/admin/invites">
            Invites
          </Link>
          <Link className="text-sm" href="/admin/event">
            Active Event
          </Link>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
