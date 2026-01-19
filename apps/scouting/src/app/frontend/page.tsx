"use client";
import { useState } from "react";
import PitForm from "@/components/PitForms";
import StandForm from "@/components/StandForms";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { FormInput } from "lucide-react";

type ViewMode = "split" | "pit" | "stand";

export default function FrontendOnlyForm() {
  const [mode, setMode] = useState<ViewMode>("split");

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-4">
          <h1 className="text-4xl font-bold text-center mt-4">Scouting Forms <FormInput className="text-4xl font-bold text-center mt-4"/></h1>
        </header>

        <div role="tablist" aria-label="Scouting views" className="flex gap-2 mb-4">
          <Button
            variant={mode === "split" ? "secondary" : "ghost"}
            onClick={() => setMode("split")}
            aria-pressed={mode === "split"}
          >
            Split
          </Button>
          <Button
            variant={mode === "pit" ? "secondary" : "ghost"}
            onClick={() => setMode("pit")}
            aria-pressed={mode === "pit"}
          >
            Pitform
          </Button>
          <Button
            variant={mode === "stand" ? "secondary" : "ghost"}
            onClick={() => setMode("stand")}
            aria-pressed={mode === "stand"}
          >
            Standform
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(mode === "split" || mode === "pit") && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">Pitform</CardTitle>
              </CardHeader>
              <CardContent>
                <PitForm />
              </CardContent>
            </Card>
          )}

          {(mode === "split" || mode === "stand") && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">Standform</CardTitle>
              </CardHeader>
              <CardContent>
                <StandForm />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
