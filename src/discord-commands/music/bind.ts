// bind bot to a voice channel.
import {
  ChannelType,
  CommandInteraction,
  SlashCommandBuilder,
  VoiceChannel,
} from "discord.js";
import { upsertGuildChannel } from "../../db/sqlite";

export const data = new SlashCommandBuilder()
  .setName("bind")
  .setDescription("Binds the bot to the voice channel.")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The voice channel to bind the bot to.")
      .addChannelTypes(ChannelType.GuildVoice)
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  const option = interaction.options.get("channel");
  const channel = option?.channel as VoiceChannel | null;
  if (!channel) {
    return interaction.reply("Please provide a valid voice channel.");
  }
  upsertGuildChannel({ guildId: channel.guildId, channelId: channel.id });
  await interaction.reply(`Binded to the ${channel.name} voice channel.`);
}
