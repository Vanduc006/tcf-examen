import { fetchTranscript } from "youtube-transcript-plus";

async function test(videoId: string) {
  try {
    console.log(`--- Testing video: ${videoId} ---`);
    console.log("Attempt 1: lang='fr', videoDetails=true");
    const res1 = await fetchTranscript(videoId, { lang: "fr", videoDetails: true });
    console.log("Success Attempt 1");
    
    console.log("Attempt 2: no lang, videoDetails=true");
    const res2 = await fetchTranscript(videoId, { videoDetails: true });
    console.log("Success Attempt 2");

  } catch (error: any) {
    console.error("Failed:", error.message);
  }
}

async function run() {
  await test("dL7LJyEmk0Q");
}

run();
