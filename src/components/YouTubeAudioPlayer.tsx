"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

declare namespace YT {
  class Player {
    constructor(
      elementId: string,
      options: {
        height?: string;
        width?: string;
        videoId: string;
        playerVars?: Record<string, string | number>;
        events?: {
          onReady?: (event: { target: Player }) => void;
          onStateChange?: (event: { data: number; target: Player }) => void;
        };
      },
    );
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    playVideo(): void;
    pauseVideo(): void;
    getCurrentTime(): number;
    getPlayerState(): number;
    destroy(): void;
  }
  const PlayerState: {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
  };
}

interface YouTubeAudioPlayerProps {
  videoId: string;
  timestampSeconds: number;
  endTimestampSeconds?: number;
  onPlayingChange?: (playing: boolean) => void;
}

let apiLoaded = false;
let apiLoading = false;
const readyCallbacks: Array<() => void> = [];

function loadYouTubeApi(): Promise<void> {
  if (apiLoaded) return Promise.resolve();
  if (typeof window === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    readyCallbacks.push(resolve);
    if (apiLoading) return;

    apiLoading = true;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      readyCallbacks.forEach((cb) => cb());
      readyCallbacks.length = 0;
    };
    document.body.appendChild(tag);
  });
}

export default function YouTubeAudioPlayer({
  videoId,
  timestampSeconds,
  endTimestampSeconds,
  onPlayingChange,
}: YouTubeAudioPlayerProps) {
  const playerRef = useRef<YT.Player | null>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).slice(2)}`);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  const updatePlaying = useCallback(
    (value: boolean) => {
      setPlaying(value);
      onPlayingChange?.(value);
    },
    [onPlayingChange],
  );

  useEffect(() => {
    let mounted = true;

    loadYouTubeApi().then(() => {
      if (!mounted || !window.YT) return;

      playerRef.current = new window.YT.Player(containerId.current, {
        height: "0",
        width: "0",
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (mounted) setReady(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              updatePlaying(true);
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              updatePlaying(false);
            }
          },
        },
      });
    });

    return () => {
      mounted = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, updatePlaying]);



  const handlePlay = () => {
    if (!playerRef.current || !ready) return;
    playerRef.current.seekTo(timestampSeconds, true);
    playerRef.current.playVideo();
  };

  const handlePause = () => {
    playerRef.current?.pauseVideo();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div id={containerId.current} className="sr-only" aria-hidden="true" />
      <button
        type="button"
        onClick={playing ? handlePause : handlePlay}
        disabled={!ready}
        className="rounded-lg bg-[#6b2d82] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#5a256d] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {playing ? "Pause" : "Écouter"}
      </button>
      <span className="text-xs text-gray-400">
        {ready ? `Début : ${formatTime(timestampSeconds)}` : "Chargement..."}
      </span>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
