import { Collection, type VoiceBasedChannel } from "discord.js";
import type { Song } from "../db/sqlite";
import {
  AudioPlayerStatus,
  type AudioPlayer,
  type VoiceConnection,
} from "@discordjs/voice";

export interface QueueItem {
  voiceChannel: VoiceBasedChannel;
  song: string; // url of song
  volume?: number;
  playing?: boolean;
  requestBy: string;
  source: "YT" | "Spotify" | "YTMusic";
}

class StateManager {
  private static instance: StateManager;
  private commands = new Collection();
  private songQueue = new Map<string, QueueItem[]>();
  private audioPlayer: { [guildId: string]: AudioPlayer } = {};
  private audioConnection: { [guildId: string]: VoiceConnection } = {};
  processedQueue: {
    [guildId: string]: (Omit<Song, "id" | "createdAt" | "timeTookToProcess"> & {
      voiceChannel: VoiceBasedChannel;
      currentRequester: string;
    })[];
  } = {};
  currentPlaying: { [guildId: string]: number } = {};
  supportedSources = ["Spotify", "YT", "YTMusic"];

  // Add a listener to notify when the queue changes
  private listeners: ((
    guildId: string,
    newQueue: QueueItem[],
    oldQueue: QueueItem[]
  ) => void)[] = [];

  private constructor() {}

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }

    return StateManager.instance;
  }

  setDiscordCommand(key: unknown, value: unknown) {
    this.commands.set(key, value);
  }

  getDiscordCommand(key: unknown) {
    return this.commands.get(key);
  }

  addSong(guildId: string, item: QueueItem) {
    item.playing ??= false;
    item.volume ??= 1;
    const oldQueue = this.songQueue.get(guildId) || [];
    const newQueue = [...oldQueue, item];
    this.songQueue.set(guildId, newQueue);
    if (!(guildId in this.currentPlaying)) this.currentPlaying[guildId] = 0;
    console.log("ADD SONG");
    this.notifyListeners(guildId, newQueue, oldQueue);
  }

  removeSong(guildId: string, index: number): void {
    const oldQueue = this.songQueue.get(guildId) || [];
    if (index < 0 || index >= oldQueue.length) {
      throw new Error("Index out of bounds");
    }
    const newQueue = [...oldQueue];
    newQueue.splice(index, 1);
    this.songQueue.set(guildId, newQueue);
    this.notifyListeners(guildId, newQueue, oldQueue);
  }

  pushSongToLast(guildId: string, index: number): void {
    const oldQueue = this.songQueue.get(guildId) || [];
    if (index < 0 || index >= oldQueue.length) {
      throw new Error("Index out of bounds");
    }
    const newQueue = [...oldQueue];
    const [song] = newQueue.splice(index, 1);
    newQueue.push(song);
    this.songQueue.set(guildId, newQueue);
    this.notifyListeners(guildId, newQueue, oldQueue);
  }

  clearQueue(guildId: string): void {
    // const oldQueue = this.songQueue.get(guildId) || [];
    this.songQueue.delete(guildId);
    delete this.processedQueue[guildId];
    // this.notifyListeners(guildId, [], oldQueue);
  }

  getQueue(guildId: string): QueueItem[] {
    return this.songQueue.get(guildId) || [];
  }

  nextSong(guildId: string) {
    this.currentPlaying[guildId]++;
    if (this.currentPlaying[guildId] >= this.processedQueue[guildId].length) {
      this.currentPlaying[guildId] = 0;
    }
  }

  prevSong(guildId: string) {
    this.currentPlaying[guildId]--;
    if (this.currentPlaying[guildId] < 0) {
      this.currentPlaying[guildId] = this.processedQueue[guildId].length - 1;
    }
  }

  setAudioPlayer(guildId: string, player: AudioPlayer) {
    this.audioPlayer[guildId] = player;
  }

  getAudioPlayer(guildId: string) {
    return this.audioPlayer[guildId];
  }

  setVoiceConnection(guildId: string, player: VoiceConnection) {
    this.audioConnection[guildId] = player;
  }

  getVoiceConnection(guildId: string) {
    return this.audioConnection[guildId];
  }

  /**
   * stops current song and plays next one
   * @param guildId
   */
  playNextSong(guildId: string) {
    const player = this.getAudioPlayer(guildId);
    this.unpauseMusic(guildId);
    player.stop();
  }

  playPreviousSong(guildId: string) {
    const player = this.getAudioPlayer(guildId);
    this.unpauseMusic(guildId);
    this.prevSong(guildId);
    this.prevSong(guildId);
    player.stop();
  }

  pauseMusic(guildId: string) {
    const player = this.getAudioPlayer(guildId);
    if (player.state.status === AudioPlayerStatus.Paused) {
      player.unpause();
    } else {
      player.pause();
    }
  }

  unpauseMusic(guildId: string) {
    const player = this.getAudioPlayer(guildId);
    if (player.state.status === AudioPlayerStatus.Paused) {
      player.unpause();
    }
  }

  stopMusic(guildId: string) {
    const connection = this.getVoiceConnection(guildId);
    connection.disconnect();
  }

  addListener(
    listener: (
      guildId: string,
      newQueue: QueueItem[],
      oldQueue: QueueItem[]
    ) => void
  ): void {
    this.listeners.push(listener);
  }

  removeListener(
    listener: (
      guildId: string,
      newQueue: QueueItem[],
      oldQueue: QueueItem[]
    ) => void
  ): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private notifyListeners(
    guildId: string,
    newQueue: QueueItem[],
    oldQueue: QueueItem[]
  ): void {
    this.listeners.forEach((listener) => listener(guildId, newQueue, oldQueue));
  }
}

export const state = StateManager.getInstance();
