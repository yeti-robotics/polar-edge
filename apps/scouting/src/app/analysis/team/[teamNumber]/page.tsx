import { Card } from "@repo/ui/components/card";

interface Props {
  params: {
    teamName: string;
  };
}

export default function Page({ params }: Props) {
  const mockTeamName = Number(params.teamName);

  const team = `Team ${mockTeamName}`;
  return (
    <div>
      <Card>
        <h1> Team Name: {team}</h1>
        <h1> Team Number: {mockTeamName}</h1>
      </Card>
    </div>
  );
}
