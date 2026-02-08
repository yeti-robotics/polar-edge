import { asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";
import { team, teamMatch } from "@/lib/database/schema";
import { getActiveEventForOrganization } from "@/lib/server/organization/active-event";
import { PitForm } from "./PitForm";

export default async function PitFormPage() {
  try {
    const member = await auth.api.getActiveMember({ headers: await headers() });
    if (!member) {
      redirect("/");
    }
    const activeEvent = await getActiveEventForOrganization(member.organizationId);

    if (!activeEvent) {
      redirect("/");
    }

    const eventTeams = await db
      .selectDistinct({
        teamNumber: team.teamNumber,
        teamName: team.teamName,
      })
      .from(teamMatch)
      .innerJoin(team, eq(team.teamNumber, teamMatch.teamNumber))
      .where(eq(teamMatch.eventId, activeEvent.eventId))
      .orderBy(asc(team.teamNumber));

    return (
      <main className="container mx-auto max-w-3xl px-5 py-8">
        <h1 className="mb-6 text-3xl tracking-tight">Pit Scout</h1>
        <PitForm teams={eventTeams} />
      </main>
    );
  } catch (error) {
    console.error(error);
    redirect("/");
  }
}
