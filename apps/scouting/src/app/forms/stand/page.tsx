import {
  Card,
  Card,
  CardContent,
  CardContent,
  CardFooter,
  CardFooter,
} from "@repo/ui/components/card";
import { FormSidebar } from "./formSidebar";
import { StandFormNavigation, StandFormNavigation, StandFormProgress } from "./StandFormNavigation";
import { StandFormProvider } from "./StandFormProvider";
import { StandFormTabs } from "./StandFormTabs";

export default function StandFormPage() {
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
    <div className="h-[calc(100vh-64px)]">
      <div className="grid grid-cols-[220px_1fr] h-full ">
        <FormSidebar />
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-mono mb-3">Stand Form</h1>
          <main className="">
            <StandFormProvider>
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
      </div>
    </div>
  );
}
