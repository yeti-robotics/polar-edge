import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTeams } from "@/features/scouting/auto-path/actions";
import { AutoPathForm } from "@/features/scouting/auto-path/components/AutoPathForm";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";

export default async function CreateAutoPathPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(routes.home);
  }

  const [teams] = await Promise.all([getTeams()]);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl tracking-tight">Create Auto Path</h1>
        <p className="mt-2 text-sm text-muted-foreground">Draw and save an auto path for a robot</p>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <AutoPathForm teams={teams} />
      </div>
    </main>
  );
}
