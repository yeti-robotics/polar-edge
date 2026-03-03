"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { login } from "@/lib/auth";

export async function signIn(formData: FormData) {
  const password = formData.get("password");

  if (!password || typeof password !== "string") {
    return;
  }

  const success = await login(password);

  if (!success) {
    return;
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("toofaToken");
  cookieStore.delete("toofaSecret");
  cookieStore.delete("toofaPassword");
  redirect("/");
}
