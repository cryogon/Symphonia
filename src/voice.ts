import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  VoiceConnection,
} from "@discordjs/voice";
import path from "node:path";
import { state, type QueueItem } from "./states";
import { getSongFromURL, insertSong } from "./db/sqlite";
import { downloadSong } from "./utils/download-song";
import { getYTURL, spotify } from "./music-service-handler/spotify";
import { createNowPlayingEmbed } from "./embeds/now-playing";

const player = createAudioPlayer({
  debug: true,
});
const songsFolder = path.resolve(__dirname, "../songs");
const processedSongs: string[] = [];

state.addListener(async (guildId, queue) => {
  console.log("Buhhh");
  // if there is no song available wait for one to load first else run task in bg
  if (!processedSongs.length) {
    state.setAudioPlayer(guildId, player);
    await initializeQueueItems(guildId, queue).catch(console.error);
  } else initializeQueueItems(guildId, queue).catch(console.error);

  if (!getVoiceConnection(guildId)) {
    playNextSong(guildId);
  }
});

function initializeQueueItems(guildId: string, cQueue: QueueItem[]) {
  if (!(guildId in state.processedQueue)) state.processedQueue[guildId] = [];
  return new Promise(async (resolve, _reject) => {
    for (const item of cQueue) {
      if (processedSongs.includes(item.song)) continue;
      const startTime = Date.now();
      const song = getSongFromURL(item.song);
      console.log("Processing:", song);
      if (song) {
        state.processedQueue[guildId].push({
          audioPath: song.audioPath,
          initialRequestedBy: item.requestBy,
          source: item.source,
          title: song.title,
          url: item.song,
          ytUrl: song.ytUrl,
          voiceChannel: item.voiceChannel,
          thumbnailPath: song.thumbnailPath,
          currentRequester: item.requestBy,
        });
        processedSongs.push(item.song);
        resolve(null);
        break;
      }
      if (song) break;

      const ytVid = await getYTURL(item.song);
      const res = await downloadSong(ytVid);

      if (!res) {
        console.error("Failed to download song with url", ytVid);
        processedSongs.push(item.song); // don't process it again even if it failed
        break;
      }

      const songToInsert = {
        audioPath: path.join(songsFolder, `${ytVid.title}.mp3`),
        title: ytVid.title,
        initialRequestedBy: item.requestBy,
        source: item.source,
        timeTookToProcess: (Date.now() - startTime) / 1000,
        url: item.song,
        ytUrl: ytVid.url,
        thumbnailPath:
          item.source !== "Spotify"
            ? ytVid.thumbnail || ytVid.image
            : (await spotify.getTrackInfo(item.song)).album.images[0].url,
      } as const;
      insertSong(songToInsert);

      state.processedQueue[guildId].push({
        audioPath: path.join(songsFolder, `${ytVid.title}.mp3`),
        initialRequestedBy: item.requestBy,
        source: item.source,
        ytUrl: songToInsert.ytUrl,
        title: songToInsert.title,
        url: item.song,
        voiceChannel: item.voiceChannel,
        thumbnailPath: songToInsert.thumbnailPath,
        currentRequester: item.requestBy,
      });
      processedSongs.push(item.song);
      resolve(null);
      break;
    }
  });
}

async function playNextSong(guildId: string) {
  const currentQueue = state.processedQueue[guildId];
  if (!currentQueue.length) {
    return;
  }
  const nextSong = currentQueue[state.currentPlaying[guildId]];
  const connection = joinVoiceChannel({
    channelId: nextSong.voiceChannel.id,
    guildId: guildId,
    adapterCreator: nextSong.voiceChannel.guild.voiceAdapterCreator,
  });
  state.setVoiceConnection(guildId, connection);
  connection.once(VoiceConnectionStatus.Disconnected, () => {
    state.clearQueue(guildId);
    processedSongs.splice(0);
    try {
      connection.destroy(); // Clean up resources
    } catch {}
  });

  const song = getSongFromURL(nextSong.url);
  if (!song) {
    console.error("Failed");
    return;
  }

  const { embeds, components } = await createNowPlayingEmbed(
    song,
    nextSong.currentRequester
  );
  nextSong.voiceChannel.send({
    embeds,
    components,
  });
  const resource = createAudioResource(song.audioPath);
  player.play(resource);
  connection.subscribe(player);

  player.once(AudioPlayerStatus.Idle, () => {
    console.log("Song Done Playing");
    state.nextSong(guildId);
    playNextSong(guildId); // Play the next song
  });

  await entersState(player, AudioPlayerStatus.Playing, 5_000);
}
