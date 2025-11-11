import fs from "node:fs";
import { Command } from "./command";

export const getCommands = () =>
  Promise.all(
    fs.readdirSync("./commands").map(async (command) => {
      const module = (await import(`../commands/${command}`)) as {
        default: Command;
      };

      return module.default;
    })
  );
