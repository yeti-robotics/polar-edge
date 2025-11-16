import { FormHeader } from "./FormHeader";
import { FormNavigation } from "./FormNavigation";
import { FormProgress } from "./FormProgress";
import { StandForm2021Provider } from "./FormProvider";

import { Card } from "@repo/ui/components/card";

//Form layout same thing as header but now for the layout, just like 2025 once again, mostly
export function FormLayout({ children }: { children: React.ReactNode }) {
    return (
        <StandForm2021Provider>
            <div className="mx-auto flex max-w-md flex-col gap-y-4">
                <Card className="overflow-hidden rounded-md border-gray-700 bg-black shadow-xl shadow-black/50">
                    <FormProgress />
                    <FormHeader />
                    {children}
                    <FormNavigation />
                </Card>
            </div>
        </StandForm2021Provider>
    );
}

