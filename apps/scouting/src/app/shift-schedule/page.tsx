import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import AdminEditing from "./components/AdminEditing";
import { requireActiveMember } from "@/lib/server/auth/require-member";

export default async function ScoutingSchedule() {
  const activeMember = await requireActiveMember();
  const isAdmin = activeMember.role === "admin" || activeMember.role === "owner";

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scouting Schedule</CardTitle>
          <TypographyMuted>View the current shift schedule for the active event.</TypographyMuted>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            Schedule details will appear here.
          </div>
        </CardContent>
      </Card>
      <AdminEditing isAdmin={isAdmin} />
    </main>
  );
}
