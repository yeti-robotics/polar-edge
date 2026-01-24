"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import Link from "next/link";
import { useState } from "react";
import { FormSidebar } from "@/app/forms/pit/formSidebar";
import { PitForm } from "./Pitform";
import { ScoringCapabilities } from "./ScoringCapabilities";

const PAGES = [
  { label: "Basic Data ", component: PitForm }, //index 0
  { label: "Scoring Capabilities ", component: ScoringCapabilities }, //index 1 (REMEMBER THIS)
];
export default function PitFormPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const CurrentPageComponent = PAGES[currentPage]?.component || (() => null);
  const progressPercentage = ((currentPage + 1) / PAGES.length) * 100;
  return (
    <div className="grid grid-cols-[220px_1fr] h-[calc(100vh-64px)] ">
      <FormSidebar />

      <main className="container mx-auto max-w-5xl space-y-4 py-8">
        <h1 className="text-3xl tracking-tight "> Pit Form </h1>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-neutral-400">
            <span>{PAGES[currentPage]?.label}</span>
            <span>
              Step {currentPage + 1} of {PAGES.length}
            </span>
          </div>
          <div className="h-2 bg-neutral-800">
            <div //test progress bar (get rid of this comment before merging, this is just for a reminder)
              className="h-2 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <Card className="p-6">
          <CurrentPageComponent />
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === PAGES.length - 1}
          >
            Next
          </Button>
        </div>
      </main>
    </div>
  );
}
