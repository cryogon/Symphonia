import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { state } from "../../states";

export const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Disconnected bot from voice channel and clear queue");

export async function execute(interaction: CommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    return await interaction.reply("Something went wrong.");
  }
  state.stopMusic(guildId);
  return await interaction.reply("Stopped.");
}
