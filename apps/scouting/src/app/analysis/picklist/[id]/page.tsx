import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { getPicklistWithTeams } from "../queries";
import { DeletePicklistButton } from "./DeletePicklistButton";
import { PicklistTeamsTable } from "./PicklistTeamsTable";
import { TeamsAtEventList } from "./TeamsAtEventList";

interface PicklistDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PicklistDetailPage({ params }: PicklistDetailPageProps) {
  const { id } = await params;
  const activeMember = await requireActiveMember();
  const data = await getPicklistWithTeams(id, activeMember.organizationId);

  if (!data) {
    redirect("/analysis/picklist");
  }

  const { picklist, teams } = data;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/analysis/picklist"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="size-4 mr-2" />
          Back to Picklists
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight">{picklist.name}</h1>
            <p className="mt-2 text-muted-foreground">
              {teams.length} {teams.length === 1 ? "team" : "teams"}
            </p>
          </div>
          <div className="flex gap-2">
            <DeletePicklistButton picklistId={id}>
              <Button variant="outline">
                <Trash2Icon className="size-4" />
                Delete Picklist
              </Button>
            </DeletePicklistButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-start">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Picklist Teams</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            <PicklistTeamsTable picklistId={id} initialTeams={teams} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <TeamsAtEventList
            eventId={picklist.eventId}
            picklistId={id}
            picklistTeams={teams.map((t) => t.teamNumber)}
          />
        </div>
      </div>
    </main>
  );
}
