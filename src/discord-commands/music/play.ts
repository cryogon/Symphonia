import {
  CommandInteraction,
  SlashCommandBuilder,
  type VoiceBasedChannel,
} from "discord.js";
import { getGuildChannel } from "../../db/sqlite";
import { state } from "../../states";
import { getSource, parseURL, stripQueryParams } from "../../utils/url";

export const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Plays music from an url")
  .addStringOption((option) =>
    option.setName("url").setDescription("Music Url").setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  const option = interaction.options.get("url");
  const musicUrl = option?.value;

  if (!musicUrl || typeof musicUrl !== "string") {
    await interaction.reply("You must provide a valid URL.");
    return;
  }

  try {
    const source = getSource(musicUrl);
    if (!state.supportedSources.includes(source)) {
      return await interaction.reply("Source not supported yet");
    }
  } catch (err: any) {
    return await interaction.reply(err.message);
  }

  try {
    new URL(musicUrl);
  } catch (_) {
    await interaction.reply("You must provide a valid URL.");
    return;
  }

  if (!interaction.guildId) {
    await interaction.reply("This command must be executed in a server.");
    return;
  }

  const voiceChannelId = getGuildChannel(interaction.guildId);

  if (!voiceChannelId) {
    await interaction.reply(
      "use `/bind` command to bind the bot to a voice channel first."
    );
    return;
  }

  const voiceChannel = await interaction.guild?.channels.fetch(
    voiceChannelId.channelId
  );

  if (!voiceChannel?.isVoiceBased()) {
    await interaction.reply("Binded channel is not a voice channel.");
    return;
  }

  const source = getSource(musicUrl);
  state.addSong(interaction.guildId, {
    requestBy: interaction.user.id,
    song: parseURL(musicUrl, source),
    voiceChannel: voiceChannel as VoiceBasedChannel,
    source: source,
  });

  await interaction.reply(`Pushed the music to queue`);
}
