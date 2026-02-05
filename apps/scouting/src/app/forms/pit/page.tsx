import { Card } from "@repo/ui/components/card";
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
    <main className="container mx-auto max-w-5xl space-y-4 py-8">
      <h1 className="text-3xl tracking-tight "> Pit Form </h1>

      <Card className="p-6">
        <PitForm />
      </Card>
    </main>
  );
}
