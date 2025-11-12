import { Client, GatewayIntentBits } from "discord.js";
import { getCommands } from "./util/getCommands";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = await getCommands();

client.on("interactionCreate", (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = commands.find(
      (c) => c.data.name === interaction.commandName
    );

    command?.autocomplete?.(interaction);
    return;
  }

  if (interaction.isStringSelectMenu()) {
    const command = commands.find(
      (c) => c.stringSelectMenu?.customId === interaction.customId
    );

    command?.stringSelectMenu?.execute(interaction);
    return;
  }

  if (interaction.isChatInputCommand()) {
    const command = commands.find(
      (c) => c.data.name === interaction.commandName
    );

    command?.execute(interaction);
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);
