import { PitForm } from "./Pitform";
import { ScoringCapabilities } from "./ScoringCapabilities";
export default function PitFormPage() {
  return (
    <main className="container mx-auto max-w-5xl space-y-4 py-8">
      <h1 className="text-3xl tracking-tight "> Pit Form </h1>
      <PitForm />
      <ScoringCapabilities />
    </main>
  );
}
