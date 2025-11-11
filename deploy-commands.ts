import { REST, Routes } from "discord.js";
import { getCommands } from "./util/getCommands";

await new REST()
  .setToken(process.env.TOKEN!)
  .put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
    body: (await getCommands()).map((c) => c.data.toJSON()),
  });
