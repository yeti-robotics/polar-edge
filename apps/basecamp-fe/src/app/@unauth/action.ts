"use server";

import { login } from "@/lib/auth";

export async function signIn(formData: FormData) {
  const password = formData.get("password");

  console.log(password);

  if (!password || typeof password !== "string") {
    return;
  }

  const success = await login(password);

  if (!success) {
    return;
  }
}
