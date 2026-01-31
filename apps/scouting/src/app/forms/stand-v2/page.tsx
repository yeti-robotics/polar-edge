import { Card, CardContent, CardFooter } from "@repo/ui/components/card";
import { StandFormNavigation } from "./StandFormNavigation";
import { StandFormProvider } from "./StandFormProvider";
import { StandFormTabs } from "./StandFormTabs";

export default function StandFormPage() {
  return (
    <div>
      <h1>Stand Form</h1>
      <main className="container mx-auto max-w-md space-y-4 py-8">
        <StandFormProvider>
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
