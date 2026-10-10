"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { cn } from "@repo/ui/lib/utils";
import { ChevronDownIcon, LoaderCircleIcon, VideoIcon, WifiOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNetworkStatus } from "@/lib/offline/use-network-status";
import { routes } from "@/lib/routes";
import { createMatchVideo, openMatchVideo } from "../actions";
import { filterMatchOptions, parseYouTubeId } from "../logic";
import type { FilmRoomMatchOption } from "../types";

/**
 * The blank video screen: an address-bar field over the empty stage. Type or
 * pick a qual match, which opens its TBA video straight away, or paste or drop
 * a YouTube link.
 */
export function FilmRoomPicker({ matchOptions }: { matchOptions: FilmRoomMatchOption[] }) {
  const router = useRouter();
  const online = useNetworkStatus();
  const inputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  // A qual match with no video yet: the next link attaches to it
  const [selectedMatch, setSelectedMatch] = useState<FilmRoomMatchOption | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Opening a video doesn't unmount this screen: the router parks it in a
  // hidden <Activity> so going back is instant, state and all. That state
  // includes the spinner we leave up while navigating, which comes back as a
  // frozen, disabled address bar. Effects re-run when the screen is shown
  // again, so clear it there, and drop any request that lands once we're gone.
  const showing = useRef(true);
  useEffect(() => {
    showing.current = true;
    setBusy(null);
    return () => {
      showing.current = false;
    };
  }, []);

  const looksLikeLink = /[/.]/.test(text) || parseYouTubeId(text) !== null;
  const suggestions = useMemo(
    () => (looksLikeLink ? [] : filterMatchOptions(matchOptions, selectedMatch ? "" : text)),
    [looksLikeLink, matchOptions, selectedMatch, text]
  );

  const openVideo = (videoId: string) => {
    router.push(routes.filmRoom.video(videoId));
  };

  const pickMatch = async (option: FilmRoomMatchOption) => {
    setText(option.label);
    setSuggestOpen(false);
    setError(null);
    if (option.videoId) {
      setBusy(`Opening ${option.label}…`);
      openVideo(option.videoId);
      return;
    }
    setBusy(`Finding ${option.label} on TBA…`);
    const result = await openMatchVideo({ matchId: option.matchId });
    if (!showing.current) return;
    if ("error" in result) {
      setBusy(null);
      setError(result.error);
      return;
    }
    if ("videoId" in result.data) {
      openVideo(result.data.videoId);
      return;
    }
    setBusy(null);
    setSelectedMatch(option);
  };

  const submitLink = async (raw: string) => {
    const url = raw.trim();
    if (!parseYouTubeId(url)) {
      // Not a link: treat it as a match search and open the only hit
      const hits = filterMatchOptions(matchOptions, url);
      const exact = hits.find((h) => h.label.toLowerCase() === url.toLowerCase());
      const hit = exact ?? (hits.length === 1 ? hits[0] : null);
      if (hit) return pickMatch(hit);
      setError("Pick a qual match, or paste a YouTube link.");
      return;
    }
    setError(null);
    setSuggestOpen(false);
    setBusy("Opening video…");
    const result = await createMatchVideo({ url, matchId: selectedMatch?.matchId ?? null });
    if (!showing.current) return;
    if ("error" in result) {
      setBusy(null);
      setError(result.error);
      return;
    }
    openVideo(result.data.videoId);
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const dropped =
      event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain");
    if (dropped) {
      setText(dropped.trim());
      void submitLink(dropped);
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drop target for pasted links
    <div
      className="relative flex size-full flex-col overflow-hidden bg-black text-white select-none"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Blank footage plate */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, oklch(0.16 0.006 285) 0 14px, oklch(0.13 0.006 285) 14px 28px)",
        }}
      >
        <span className="font-mono text-xs text-white/40">Film Room</span>
      </div>

      {!online && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1.5 text-xs">
          <WifiOffIcon className="size-3.5" />
          Offline
        </div>
      )}

      {/* Address bar: type a match or a link; the chevron opens the qual list */}
      <div className="relative z-20 flex flex-col gap-2 bg-gradient-to-b from-black/75 to-transparent px-4.5 py-4">
        <form
          className={cn(
            "relative w-[520px] max-w-full",
            !online && "ml-[108px] max-w-[calc(100%-108px)]"
          )}
          onSubmit={(e) => {
            e.preventDefault();
            void submitLink(text);
          }}
        >
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              const next = e.target.value;
              setText(next);
              // Pasting a link after picking a match attaches it to that match,
              // typing anything else is a new search
              if (!parseYouTubeId(next)) setSelectedMatch(null);
              setSuggestOpen(true);
              setError(null);
            }}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => window.setTimeout(() => setSuggestOpen(false), 150)}
            placeholder="Qual match, or paste a YouTube link…"
            inputMode="url"
            autoComplete="off"
            disabled={busy !== null}
            className="h-11.5 rounded-full border-white/15 bg-white/10 pr-11 pl-4 text-sm text-white placeholder:text-white/50 md:text-sm"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Show qual matches"
            disabled={busy !== null}
            className="absolute top-1.5 right-1.5 size-8.5 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => setSuggestOpen((v) => !v)}
          >
            <ChevronDownIcon className="size-4.5" />
          </Button>

          {suggestOpen && suggestions.length > 0 && (
            <div className="absolute top-13 right-0 left-0 z-20 flex max-h-[min(60vh,420px)] flex-col overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-lg">
              {suggestions.map((m) => (
                <button
                  key={m.matchId}
                  type="button"
                  // Keep focus in the field so onBlur doesn't close the list first
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void pickMatch(m)}
                  className="flex h-11 shrink-0 items-center gap-2 border-b border-border/50 px-3.5 text-left text-sm last:border-b-0 hover:bg-accent"
                >
                  <VideoIcon className="size-4 text-muted-foreground" />
                  {m.label}
                  {(m.videoId || m.tbaYoutubeId) && (
                    <span className="ml-auto size-1.5 rounded-full bg-primary" title="Has video" />
                  )}
                </button>
              ))}
            </div>
          )}
        </form>
        {selectedMatch && !busy && (
          <p className={cn("text-sm text-white/70", !online && "ml-[108px]")}>
            No video on TBA for {selectedMatch.label} yet. Paste a YouTube link for it.
          </p>
        )}
        {error && <p className={cn("text-sm text-red-400", !online && "ml-[108px]")}>{error}</p>}
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center">
        {busy ? (
          <div className="inline-flex h-12 items-center gap-2.5 rounded-full bg-black/40 px-5 text-sm font-medium">
            <LoaderCircleIcon className="size-4 animate-spin" />
            {busy}
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-full border-white/20 bg-black/40 px-5 text-sm text-white hover:bg-black/60 hover:text-white dark:border-white/20 dark:bg-black/40 dark:hover:bg-black/60"
            onClick={() => {
              inputRef.current?.focus();
              setSuggestOpen(true);
            }}
          >
            <VideoIcon className="size-4.5" />
            Browse qual matches
          </Button>
        )}
      </div>
    </div>
  );
}
