"use client";
import { Card } from "@repo/ui/components/card";
import { FormSidebar } from "./FormSidebar";
import { PitForm } from "./PitForm";

export default function PitFormPage() {
  return (
    <main className="container mx-auto max-w-5xl space-y-4 py-8">
      <h1 className="text-3xl tracking-tight "> Pit Form </h1>

      <Card className="p-6">
        <PitForm />
      </Card>
    </main>
  );
}
