import * as fs from "fs";
import * as mm from "music-metadata";

export async function getMusicDuration(filePath: string) {
  try {
    // Read the audio file into a buffer
    const fileBuffer = new Uint8Array(fs.readFileSync(filePath));

    // Parse the buffer for metadata
    const metadata = await mm.parseBuffer(fileBuffer, "audio/mpeg");

    // Extract and return the duration
    const duration = metadata.format.duration;
    if (duration) {
      return secondsToTimeString(duration / 60);
    } else {
      console.error("Duration not found in metadata.");
      return "0";
    }
  } catch (error) {
    console.error("Error reading audio metadata:", error);
    return "0";
  }
}

function secondsToTimeString(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}
