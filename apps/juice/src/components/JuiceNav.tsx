import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

interface JuiceNavProps {
  active: "home" | "analyzer" | "tracker" | "how-to-use";
}

const links = [
  { href: "/", label: "Home", key: "home" },
  { href: "/analyzer", label: "Analyzer", key: "analyzer" },
  { href: "/tracker", label: "Tracker", key: "tracker" },
  { href: "/how-to-use", label: "How to use?", key: "how-to-use" },
] as const;

export function JuiceNav({ active }: JuiceNavProps) {
  return (
    <div className="sticky top-0 z-50 flex items-center gap-4 border-b border-border bg-background/95 px-5 py-2.5 backdrop-blur-sm">
      <a
        href="/"
        className="shrink-0 font-mono text-sm font-bold uppercase tracking-widest text-primary"
      >
        JUICE
      </a>
      <nav className="flex gap-0 overflow-x-auto">
        {links.map(({ href, label, key }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "font-mono text-[10px] uppercase tracking-wider",
              active === key && "border-b-2 border-primary text-primary"
            )}
          >
            <a href={href}>{label}</a>
          </Button>
        ))}
      </nav>
    </div>
  );
}
