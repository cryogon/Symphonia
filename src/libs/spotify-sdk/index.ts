import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import yts from "yt-search";

type SpotifyCredentials = {
  clientId: string;
  clientSecret: string;
};

export class Spotify {
  creds: SpotifyCredentials;
  spotifyApi: SpotifyApi;
  accessToken: string | null = null;

  constructor(creds: SpotifyCredentials) {
    this.creds = creds;
    this.spotifyApi = SpotifyApi.withClientCredentials(
      creds.clientId,
      creds.clientSecret
    );
  }

  async searchTrack(query: string) {
    return await this.spotifyApi.search(query, ["track"], undefined, 5);
  }

  async getTrackInfo(trackUrl: string) {
    const trackId = this.getTrackId(trackUrl);
    return await this.spotifyApi.tracks.get(trackId);
  }

  async searchSongsYTLink(query: string) {
    const result = await this.searchTrack(query);
    const song = result.tracks.items[0];
    const r = await yts(`${song.artists[0].name} - ${song.name}`);
    return r.videos.slice(0, 1);
  }

  async getSongsYTLink(trackUrl: string) {
    const song = await this.getTrackInfo(trackUrl);
    const r = await yts(`${song.artists[0].name} - ${song.name}`);
    return r.videos.slice(0, 1);
  }

  getTrackId(url: string) {
    const urlObj = new URL(url);
    url = urlObj.origin + urlObj.pathname;
    const chunks = url.split("/");
    return chunks[chunks.length - 1];
  }
}
