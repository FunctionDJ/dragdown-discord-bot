import { Client, GatewayIntentBits } from "discord.js";
import { getCommands } from "./util/get-commands";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = await getCommands();

// oxlint-disable-next-line no-misused-promises
client.on("interactionCreate", async (interaction) => {
	if (interaction.isAutocomplete()) {
		const command = commands.find(
			(command) => command.data.name === interaction.commandName
		);

		await command?.autocomplete?.(interaction);
		return;
	}

	if (interaction.isStringSelectMenu()) {
		const command = commands.find(
			(command) => command.stringSelectMenu?.customId === interaction.customId
		);

		await command?.stringSelectMenu?.execute(interaction);
		return;
	}

	if (interaction.isChatInputCommand()) {
		const command = commands.find(
			(command) => command.data.name === interaction.commandName
		);

		await command?.execute(interaction);
		return;
	}
});

await client.login(process.env.DISCORD_TOKEN);
