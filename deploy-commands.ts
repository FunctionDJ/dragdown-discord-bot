import { REST, Routes } from "discord.js";
import { getCommands } from "./util/getCommands";

await new REST()
  .setToken(process.env.DISCORD_TOKEN!)
  .put(
    Routes.applicationGuildCommands(
      process.env.DISCORD_CLIENT_ID!,
      process.env.DISCORD_DEV_GUILD_ID!
    ),
    {
      body: (await getCommands()).map((c) => c.data.toJSON()),
    }
  );
