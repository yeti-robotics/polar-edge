import { CardContent, CardFooter } from "@repo/ui/components/card";
import { FormSidebar } from "./formSidebar";
import { PitForm } from "./PitForm";

export default async function PitFormPage() {
  return (
    <div className="grid grid-cols-[220px_1fr] h-full">
      <FormSidebar />
      <div className="flex flex-col items-center justify-center">
        <main className="w-full max-w-md">
          <h1 className="text-3xl font-mono mb-3 text-center">Pit Form</h1>
          <CardContent>
            <PitForm />
          </CardContent>
          <CardFooter className="flex w-full justify-between"></CardFooter>
        </main>
      </div>
    </div>
  );
}
