import { Client, GatewayIntentBits, MessageFlags } from "discord.js";
import { getCommands } from "./util/getCommands";
import { fetchGlossary, glossaryComponents } from "./commands/glossary";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = await getCommands();

client.on("interactionCreate", async (interaction) => {
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "glossary-select"
  ) {
    await interaction.deferUpdate();
    const entry = await fetchGlossary(interaction.values[0]);

    await interaction.editReply({
      components: glossaryComponents(entry[0]),
      flags: MessageFlags.IsComponentsV2,
    });

    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.find((c) => c.data.name === interaction.commandName);
  command?.execute(interaction);
});

client.login(process.env.DISCORD_TOKEN);
