import { fetchTranscript, toVTT } from "youtube-transcript-plus";
import type { TranscriptResult } from "youtube-transcript-plus";

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractVideoId(url: string): string {
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(YOUTUBE_ID_REGEX);
  if (!match?.[1]) {
    throw new Error("Invalid YouTube URL or video ID");
  }
  return match[1];
}

export function buildVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export async function fetchVideoTranscript(
  videoIdOrUrl: string,
  lang = "fr",
): Promise<{ vtt: string; title: string; videoId: string }> {
  const videoId = extractVideoId(videoIdOrUrl);

  let result: TranscriptResult | Awaited<ReturnType<typeof fetchTranscript>>;
  try {
    result = (await fetchTranscript(videoId, {
      lang,
      videoDetails: true,
    })) as TranscriptResult;
  } catch {
    result = (await fetchTranscript(videoId, {
      videoDetails: true,
    })) as TranscriptResult;
  }

  const segments = "segments" in result ? result.segments : result;
  const vtt = toVTT(segments);
  const title =
    "videoDetails" in result && result.videoDetails?.title
      ? result.videoDetails.title
      : `TCF Compréhension Orale - ${videoId}`;

  return { vtt, title, videoId };
}
