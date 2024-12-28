import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  type Interaction,
} from "discord.js";
import path from "node:path";
import fs from "node:fs";
import { state } from "./states";
import "./voice";
import { AudioPlayerStatus } from "@discordjs/voice";

const client: Client<true> = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const foldersPath = path.join(__dirname, "discord-commands");
const commandFolders = fs.readdirSync(foldersPath);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// register commands
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      state.setDiscordCommand(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// handle commands and button interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    console.log("I'm button");
    await handleButtonInteraction(interaction);
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command: any = state.getDiscordCommand(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

// Log in to Discord with your client's token
const res = await client.login(process.env.DISCORD_TOKEN);

export async function handleButtonInteraction(interaction: Interaction) {
  if (!interaction.isButton()) return;
  if (!interaction.guildId) return;
  console.log(interaction.customId, "Pressed");
  switch (interaction.customId) {
    case "playPrevSong":
      state.playPreviousSong(interaction.guildId);
      await interaction.reply({
        content: "Playing previous song.",
        ephemeral: true,
      });
      break;
    case "pauseSong":
      const player = state.getAudioPlayer(interaction.guildId);
      const content =
        player.state.status === AudioPlayerStatus.Paused
          ? "Song Unpaused."
          : "Song Paused.";
      state.pauseMusic(interaction.guildId);
      await interaction.reply({ content, ephemeral: true });
      break;
    case "playNextSong":
      state.playNextSong(interaction.guildId);
      await interaction.reply({
        content: "Playing next song.",
        ephemeral: true,
      });
      break;
    default:
      await interaction.reply({ content: "Unknown action.", ephemeral: true });
      break;
  }
}
