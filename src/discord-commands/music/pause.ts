import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { state } from "../../states";
import { AudioPlayerStatus } from "@discordjs/voice";

export const data = new SlashCommandBuilder()
  .setName("pause")
  .setDescription("Pause Music");

export async function execute(interaction: CommandInteraction) {
  if (!interaction.guildId) {
    return await interaction.reply("something is wrong");
  }
  state.pauseMusic(interaction.guildId);
  const player = state.getAudioPlayer(interaction.guildId);
  const content =
    player.state.status === AudioPlayerStatus.Paused ? "Paused" : "Playing";
  await interaction.reply({ content, ephemeral: true });
}
