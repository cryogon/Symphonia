import yts from "yt-search";
import { Spotify } from "../libs/spotify-sdk";
import { convertYTMusicURLtoYt, getSource } from "../utils/url";

const creds = {
  clientId: process.env.SPOTIFY_CLIENT_ID || "your-client-id",
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "your-client-secret",
} as const;

export const spotify = new Spotify(creds);

export async function getYTURL(trackUrl: string) {
  const source = getSource(trackUrl);

  if (source === "YT" || source === "YTMusic") {
    const ytUrl = new URL(trackUrl);
    const data = await yts({ videoId: ytUrl.searchParams.get("v") || "" });
    return data;
  }
  const songs = await spotify.getSongsYTLink(trackUrl);
  return songs[0];
}
