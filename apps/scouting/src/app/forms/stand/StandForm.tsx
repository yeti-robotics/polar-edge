import StartTimer from "./Timer";

export function StandForm() {
  //going to use the Card component in page.tsx to wrap this form (got rid of it here, so that I can make it like 2 pages better)
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <StartTimer />
      </section>
    </div>
  );
}
