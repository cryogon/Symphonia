import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { createQueueEmbed } from "../../embeds/queue";

export const data = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("Get Current Queue List");

export async function execute(interaction: CommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply("This command must be executed in a server.");
    return;
  }
  await interaction.reply({ embeds: [createQueueEmbed(interaction.guildId)] });
}
