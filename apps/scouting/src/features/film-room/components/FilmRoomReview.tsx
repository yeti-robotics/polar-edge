"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { routes } from "@/lib/routes";
import { readQueuedOps, useMarkSync } from "../hooks/use-mark-sync";
import { applyQueuedOps } from "../logic";
import type { Annotation, FilmRoomTeamOption } from "../types";
import { VideoAnnotator } from "./video-annotator/VideoAnnotator";

interface FilmRoomReviewProps {
  videoId: string;
  youtubeId: string;
  title: string;
  initialAnnotations: Annotation[];
  teams: FilmRoomTeamOption[];
  initialTime?: number;
}

export function FilmRoomReview({
  videoId,
  youtubeId,
  title,
  initialAnnotations,
  teams,
  initialTime,
}: FilmRoomReviewProps) {
  const router = useRouter();
  const { online, saveMark, deleteMark } = useMarkSync(videoId);
  // The player, canvas and offline queue are browser-only, and waiting for the
  // mount also lets marks that haven't synced yet show up on reload
  const [marks, setMarks] = useState<Annotation[] | null>(null);

  useEffect(() => {
    setMarks(applyQueuedOps(initialAnnotations, readQueuedOps(videoId)));
  }, [initialAnnotations, videoId]);

  if (!marks) return <div className="size-full bg-black" />;

  return (
    <VideoAnnotator
      key={videoId}
      youtubeId={youtubeId}
      title={title}
      initialAnnotations={marks}
      teams={teams}
      initialTime={initialTime}
      offline={!online}
      onSaveMark={saveMark}
      onDeleteMark={deleteMark}
      onBack={() => router.push(routes.filmRoom.root)}
    />
  );
}
