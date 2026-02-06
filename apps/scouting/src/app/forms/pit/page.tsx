import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PitForm } from "./PitForm";

export default async function PitFormPage() {
  try {
    const member = await auth.api.getActiveMember({ headers: await headers() });
    if (!member) {
      redirect("/");
    }
  } catch (error) {
    console.error(error);
    redirect("/");
  }

  return (
    <main className="container mx-auto max-w-3xl px-5 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Pit Scout</h1>
      <PitForm />
    </main>
  );
}
