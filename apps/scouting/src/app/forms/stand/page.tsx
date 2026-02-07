import { Card, CardContent, CardFooter } from "@repo/ui/components/card";
import { UnsavedChangesWarning } from "./components/UnsavedChangesWarning";
import { StandFormNavigation, StandFormProgress } from "./StandFormNavigation";
import { StandFormProvider } from "./StandFormProvider";
import { StandFormTabs } from "./StandFormTabs";

export default function StandFormPage() {
  return (
    <div className="py-6 max-w-md w-full mx-auto px-4">
      <h1 className="mb-6 text-3xl tracking-tight">Stand Form</h1>

      <main className="w-full">
        <StandFormProvider>
          <UnsavedChangesWarning />
          <div className="mb-4">
            <StandFormProgress />
          </div>

          <Card>
            <CardContent>
              <StandFormTabs />
            </CardContent>
            <CardFooter className="flex w-full justify-between">
              <StandFormNavigation />
            </CardFooter>
          </Card>
        </StandFormProvider>
      </main>
    </div>
  );
}
