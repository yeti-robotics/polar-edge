interface JuiceNavProps {
  active: "home" | "analyzer" | "tracker";
}

const links = [
  { href: "/polar-edge/juice/", label: "Home", key: "home" },
  { href: "/polar-edge/juice/analyzer", label: "Analyzer", key: "analyzer" },
  { href: "/polar-edge/juice/tracker", label: "Tracker", key: "tracker" },
] as const;

export function JuiceNav({ active }: JuiceNavProps) {
  return (
    <div className="sticky top-0 z-50 flex items-center gap-4 border-b border-border bg-background/95 px-5 py-2.5 backdrop-blur-sm">
      <a href="/polar-edge/juice/" className="shrink-0 font-mono text-sm font-bold uppercase tracking-widest text-primary">
        JUICE
      </a>
      <nav className="flex gap-0 overflow-x-auto">
        {links.map(({ href, label, key }) => (
          <a
            key={key}
            href={href}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              active === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
