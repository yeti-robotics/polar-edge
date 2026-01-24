import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { useState } from "react";
import { PitForm } from "./Pitform";
import { ScoringCapabilities } from "./ScoringCapabilities";

const PAGES = [
  { label: "Basic Data", component: PitForm },
  { label: "Scoring Capabilities", component: ScoringCapabilities },
];
export default function PitFormPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const CurrentPageComponent = PAGES[currentPage].component;
  const progressPercentage = ((CurrentPage + 1) / PAGES.length) * 100;
  return (
    <main className="container mx-auto max-w-5xl space-y-4 py-8">
      <h1 className="text-3xl tracking-tight "> Pit Form </h1>

      <div className="spave-y-4">
        <div className="mb-4 h-2 w-full rounded-full bg-neutral-200">
          <span>{PAGES[currentPage].label}</span>
        </div>
      </div>
      <PitForm />
      <ScoringCapabilities />
    </main>
  );
}
