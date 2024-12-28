import { EmbedBuilder } from "discord.js";
import { state } from "../states";

export function createQueueEmbed(guildId: string) {
  const embed = new EmbedBuilder().setTitle("Music Queue").setColor("#0099ff");
  const currentPlaying = state.currentPlaying[guildId]; // index of current playing song
  const processQueue = state.processedQueue[guildId] || [];

  if (processQueue.length === 0) {
    embed.setDescription("The queue is currently empty.");
  } else {
    processQueue.forEach((song, index) => {
      if (index === currentPlaying) {
        embed.addFields({
          name: `▶️ ${index + 1}. ${song.title} - \`<@${
            song.currentRequester
          }>\``,
          value: song.url,
        });
      } else {
        embed.addFields({
          name: `${index + 1}. ${song.title} - \`<@${song.currentRequester}>\``,
          value: song.url,
        });
      }
    });
  }

  return embed;
}
