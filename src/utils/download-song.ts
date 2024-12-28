import { $ } from "bun";
import { readdirSync } from "node:fs";
import path from "node:path";
import type yts from "yt-search";

const songsFolder = path.resolve(__dirname, "../../songs");
const cookiesPath = path.resolve(__dirname, "../../cookies.txt");

// downloads song from youtube using youtube-dl
export async function downloadSong(
  video: yts.VideoSearchResult | yts.VideoMetadataResult
) {
  const url = video.url;
  if (!validateYTURL(url)) {
    throw new Error("Invalid URL");
  }

  let title = video.title;

  try {
    const songWithSameNameExists = readdirSync(songsFolder).includes(title);
    // changing file name in case it already exists
    if (songWithSameNameExists) title += `-${Date.now()}`;
  } catch {} // dir not exists. no need to log since yt-dlp command will create it automatically

  try {
    // passing cookie to it works on server
    await $`yt-dlp --cookies ${cookiesPath} --extract-audio --audio-format mp3 -o "${songsFolder}/${title}.%(ext)s" "${url}"`;
    return true;
  } catch (err) {
    console.error("Failed to download song with url:", url, "err:", err);
    return false;
  }
}

export function validateYTURL(url: string) {
  if (url.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/)) {
    return true;
  } else {
    return false;
  }
}
