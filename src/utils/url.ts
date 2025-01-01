export function getSource(url: string) {
  const tURL = new URL(url);
  if (url.startsWith("https://open.s")) return "Spotify";
  if (url.startsWith("https://music.youtube")) return "YTMusic";
  if (
    url.startsWith("https://www.youtube") ||
    url.startsWith("https://youtube")
  ) {
    if (!tURL.searchParams.get("v")) {
      throw new Error("Invalid YT Link! Missing Video Id");
    }
    return "YT";
  }
  if (url.startsWith("https://youtu.be")) return "YT";
  throw new Error("Unsupported Link");
}

export function stripQueryParams(url: string) {
  try {
    const oUrl = new URL(url);
    return `${oUrl.origin}${oUrl.pathname}`;
  } catch {
    throw new Error("Invalid URL");
  }
}

export function convertYTMusicURLtoYt(url: string) {
  try {
    const oUrl = new URL(url);
    if (!oUrl.searchParams.get("v")) throw null;
    return `https://youtube.com/watch?v=${oUrl.searchParams.get("v")}`;
  } catch {
    throw new Error("Invalid URL");
  }
}

export function parseURL(musicUrl: string, source: string) {
  const baseUrl = source === "Spotify" ? stripQueryParams(musicUrl) : musicUrl;

  const url = new URL(baseUrl);

  if (source === "YT" && url.hostname === "youtu.be") {
    return `https://youtube.com/watch?v=${url.pathname.slice(1)}`;
  }

  return baseUrl;
}
