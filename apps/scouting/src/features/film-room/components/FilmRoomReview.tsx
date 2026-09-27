"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { routes } from "@/lib/routes";
import { readQueuedOps, useMarkSync } from "../hooks/use-mark-sync";
import { applyQueuedOps } from "../logic";
import type { Annotation, FilmRoomTeamOption, PlayableSource } from "../types";
import { VideoAnnotator } from "./VideoAnnotator";

interface FilmRoomReviewProps {
  videoId: string;
  source: PlayableSource;
  title: string;
  initialAnnotations: Annotation[];
  teams: FilmRoomTeamOption[];
  initialTime?: number;
}

/** One match video under review: the annotator wired to autosave. */
export function FilmRoomReview({
  videoId,
  source,
  title,
  initialAnnotations,
  teams,
  initialTime,
}: FilmRoomReviewProps) {
  const router = useRouter();
  const { online, saveMark, deleteMark } = useMarkSync(videoId);
  // The player, canvas and offline queue are all browser-only; waiting for the
  // mount also lets marks that haven't synced yet show up on reload.
  const [marks, setMarks] = useState<Annotation[] | null>(null);

  useEffect(() => {
    setMarks(applyQueuedOps(initialAnnotations, readQueuedOps(videoId)));
  }, [initialAnnotations, videoId]);

  if (!marks) return <div className="size-full bg-black" />;

  return (
    <VideoAnnotator
      key={videoId}
      source={source}
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
