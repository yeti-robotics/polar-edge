import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { FilmRoomReview } from "@/features/film-room/components/FilmRoomReview";
import { getMatchTeams, getMatchVideo, getVideoAnnotations } from "@/features/film-room/queries";
import type { FilmRoomTeamOption, PlayableSource } from "@/features/film-room/types";
import { getEventTeams } from "@/features/scouting/pit/queries";
import { requireActiveMember } from "@/lib/server/auth/require-member";
import { createPresignedDownloadUrl } from "@/lib/server/storage";

interface FilmRoomVideoPageProps {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ t?: string }>;
}

async function FilmRoomVideoContent({ params, searchParams }: FilmRoomVideoPageProps) {
  const [{ videoId }, { t }] = await Promise.all([params, searchParams]);
  if (!z.string().uuid().safeParse(videoId).success) notFound();

  const member = await requireActiveMember();
  const row = await getMatchVideo(videoId, member.organizationId);
  if (!row) notFound();
  const { video } = row;

  let source: PlayableSource | null = null;
  if (video.source === "youtube" && video.youtubeId) {
    source = { kind: "youtube", value: video.youtubeId };
  } else if (video.source === "upload" && video.storageKey) {
    try {
      source = { kind: "upload", value: await createPresignedDownloadUrl(video.storageKey) };
    } catch (error) {
      console.error("[film-room] could not sign video URL:", error);
    }
  }
  if (!source) {
    return (
      <div className="flex size-full items-center justify-center text-sm text-white/70">
        This video can't be played right now.
      </div>
    );
  }

  // The match's six teams when it's linked; otherwise everyone at the event.
  let teams: FilmRoomTeamOption[] = [];
  if (video.matchId) {
    teams = await getMatchTeams(video.matchId);
  } else if (video.eventId) {
    teams = (await getEventTeams(video.eventId)).map((team) => ({
      teamNumber: team.teamNumber,
      name: team.teamName,
    }));
  }

  const annotations = await getVideoAnnotations(video.id, member.organizationId);
  const startAt = Number.parseInt(t ?? "", 10);

  return (
    <FilmRoomReview
      videoId={video.id}
      source={source}
      title={video.title}
      initialAnnotations={annotations}
      teams={teams}
      initialTime={Number.isFinite(startAt) && startAt > 0 ? startAt : undefined}
    />
  );
}

export default function FilmRoomVideoPage(props: FilmRoomVideoPageProps) {
  return (
    <Suspense fallback={<div className="size-full bg-black" />}>
      <FilmRoomVideoContent {...props} />
    </Suspense>
  );
}
