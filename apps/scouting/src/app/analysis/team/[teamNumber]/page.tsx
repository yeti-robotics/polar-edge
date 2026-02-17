import { redirect } from "next/navigation";

interface AnalysisTeamPageProps {
  params: Promise<{ teamNumber: string }>;
}

export default async function AnalysisTeamPage({ params }: AnalysisTeamPageProps) {
  const { teamNumber } = await params;
  redirect(`/data/teams/${teamNumber}`);
}
