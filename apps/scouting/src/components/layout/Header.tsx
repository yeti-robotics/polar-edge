import Link from "next/link";
import { OrganizationSelector } from "./OrganizationSelector";

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 px-4 border-b flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="font-mono uppercase text-xs">Polar Edge</span>
        <OrganizationSelector />
      </div>
      <nav className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
        <Link href="/">Home</Link>
      </nav>
    </header>
  );
}
