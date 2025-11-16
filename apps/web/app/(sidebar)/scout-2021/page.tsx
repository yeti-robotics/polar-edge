import { FormLayout } from "./form/FormLayout";
import { StandForm } from "./form/StandForm";

import { checkSession } from "@/lib/auth/utils";
import { UserRole } from "@/lib/database/schema";

//Final page for the stand form!
export default async function Scout2021Page() {
    await checkSession(UserRole.USER);

    return (
        <FormLayout>
            <StandForm />
        </FormLayout>
    );
}

