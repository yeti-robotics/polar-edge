"use server";

import { createServerValidate, ServerValidateError } from "@tanstack/react-form-nextjs";

const serverValidate = createServerValidate({
  onServerValidate: async ({ value }) => {},
});

export async function submitPitForm(_prevState: unknown, formData: FormData) {
  try {
    const validated = await serverValidate(formData);
    console.log(validated);
  } catch (error) {
    if (error instanceof ServerValidateError) {
      return error.formState;
    }
    throw error;
  }
}
