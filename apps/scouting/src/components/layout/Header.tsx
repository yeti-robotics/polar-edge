import Link from "next/link";
import { OrganizationSelector } from "./OrganizationSelector";

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 px-4 border-b flex items-center justify-between bg-background">
      <div className="flex items-center gap-4">
        <span className="font-mono uppercase text-xs">Polar Edge</span>
        <OrganizationSelector />
      </div>
      <nav className="flex items-center gap-14 text-xs font-mono text-muted-foreground mr-82 mt-5">
        <Link className="hover:text-white hover:bg-neutral-800" href="/">Home</Link>
        <Link className="hover:text-white hover:bg-neutral-800" href="/auto-path">Auto Paths</Link>
        <Link className="hover:text-white hover:bg-neutral-800" href="/scouting"> Scouting </Link>
        <Link className="hover:text-white hover:bg-neutral-800" href="/profile"> Profile </Link>
        <Link className="hover:text-white hover:bg-neutral-800" href="/AI"> AI </Link>
        <Link className="hover:text-white hover:bg-neutral-800" href="/results"> Data </Link>


      </nav>
    </header>
  );
}