import { Button } from "@repo/ui/components/button";
import { useEffect, useRef, useState } from "react";
import { JuiceNav } from "../JuiceNav";

const SECTIONS = [
  { id: "s-voltage", label: "① Voltage" },
  { id: "s-current", label: "② Current" },
  { id: "s-power", label: "③ Power" },
  { id: "s-impedance", label: "④ Impedance" },
  { id: "s-pdh", label: "⑤ PDH Channels" },
] as const;

interface AnalysisNavProps {
  onNewFiles: () => void;
}

export function AnalysisNav({ onNewFiles }: AnalysisNavProps) {
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="sticky top-0 z-50">
      <JuiceNav active="analyzer" />
      <div className="flex items-center gap-4 border-b border-border bg-background/95 px-5 py-1 backdrop-blur-sm">
        <nav className="flex flex-1 gap-0 overflow-x-auto">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setActiveSection(id)}
              className={`whitespace-nowrap border-b-2 px-4 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                activeSection === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
        <Button size="sm" onClick={onNewFiles}>
          ⬆ New files
        </Button>
      </div>
    </div>
  );
}
