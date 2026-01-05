import { FormHeader } from "./FormHeader";
import { FormNavigation } from "./FormNavigation";
import { FormProgress } from "./FormProgress";
import { StandFormProvider } from "./FormProvider";

import { Card } from "@repo/ui/components/card";

export function FormLayout({ children }: { children: React.ReactNode }) {
	return (
		<StandFormProvider>
			<div className="mx-auto flex max-w-md flex-col gap-y-4">
				<Card className="overflow-hidden rounded-md">
					<FormProgress />
					<FormHeader />
					{children}
					<FormNavigation />
				</Card>
			</div>
		</StandFormProvider>
	);
}
