import { REST, Routes } from "discord.js";
import { getCommands } from "./util/get-commands";

const commands = await getCommands();

await new REST()
	.setToken(process.env.DISCORD_TOKEN!)
	.put(
		Routes.applicationGuildCommands(
			process.env.DISCORD_CLIENT_ID!,
			process.env.DISCORD_DEV_GUILD_ID!
		),
		{
			body: commands.map((command) => command.data.toJSON()),
		}
	);
