import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import type { Song } from "../db/sqlite";
import { getMusicDuration } from "../utils/get-music-duration";

export async function createNowPlayingEmbed(song: Song, requester: string) {
  const songDuration = await getMusicDuration(song.audioPath); // in minutes;
  const embed = new EmbedBuilder()
    .setTitle("Now Playing")
    .setDescription(song.title)
    .setThumbnail(song.thumbnailPath)
    .addFields(
      {
        name: "Requested by",
        value: `<@${requester}>`,
        inline: true,
      },
      {
        name: "Duration",
        value: songDuration,
        inline: true,
      }
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("playPrevSong")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("pauseSong")
      .setLabel("Pause")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("playNextSong")
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}
