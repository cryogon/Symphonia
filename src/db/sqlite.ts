import { Database } from "bun:sqlite";
import path from "node:path";

type Source = "YT" | "Spotify" | "YTMusic";
export type Song = {
  title: string;
  source: Source;
  url: string;
  ytUrl: string;
  audioPath: string;
  initialRequestedBy: string;
  timeTookToProcess: number;
  thumbnailPath: string;
};

type Guild = {
  id: number;
  guildId: string;
  channelId: string;
  createdAt: string;
};

const rootPath = path.resolve(__dirname, "../../");
function initDB(dbName: string = "symphonia.db") {
  const dbPath = path.resolve(rootPath, dbName);
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        source TEXT CHECK(source IN ('YT', 'Spotify', 'YTMusic')),
        url TEXT UNIQUE,
        ytLink TEXT, -- this is the youtube link of the song
        audioPath TEXT,
        thumbnailPath TEXT,
        initialRequestedBy TEXT, -- this is discord user who initially requested it
        timeTookToProcess INTEGER, -- in seconds (that initial user had to face)
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS guild_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT UNIQUE,
        channelId TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`);

  return db;
}

const db = initDB();

export function insertSong(song: Song) {
  db.prepare(
    "INSERT INTO songs (title, source, url, ytLink, audioPath, initialRequestedBy, timeTookToProcess, thumbnailPath) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    song.title,
    song.source,
    song.url,
    song.ytUrl,
    song.audioPath,
    song.initialRequestedBy,
    song.timeTookToProcess,
    song.thumbnailPath
  );
}

export function updateSong(
  id: number,
  updatedFields: Partial<Omit<Song, "id" | "createdAt">>
) {
  const fields = Object.keys(updatedFields);
  const values = Object.values(updatedFields);
  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  db.prepare(`UPDATE songs SET ${setClause} WHERE id = ?`).run(...values, id);
}

export function getSongs() {
  return db.prepare("SELECT * FROM songs").all() as Song[];
}

export function getSong(id: number) {
  return db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as Song | null;
}

export function getSongFromURL(url: string) {
  return db
    .prepare("SELECT * FROM songs WHERE url = ?")
    .get(url) as Song | null;
}

export function upsertGuildChannel(guildChannel: {
  guildId: string;
  channelId: string;
}) {
  try {
    db.prepare(
      "INSERT INTO guild_channels (guildId, channelId) VALUES (?, ?)"
    ).run(guildChannel.guildId, guildChannel.channelId);
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      db.prepare(
        "UPDATE guild_channels SET channelId = ? WHERE guildId = ?"
      ).run(guildChannel.channelId, guildChannel.guildId);
    } else {
      throw error;
    }
  }
}

export function getGuildChannel(guildId: string) {
  return db
    .prepare("SELECT * FROM guild_channels WHERE guildId = ?")
    .get(guildId) as Guild | null;
}
