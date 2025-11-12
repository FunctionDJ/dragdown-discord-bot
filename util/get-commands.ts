import type { Command } from "./command";
import fs from "node:fs";

export const getCommands = () =>
	Promise.all(
		fs.readdirSync("./commands").map(async (command) => {
			// oxlint-disable-next-line no-unsafe-assignment
			const untypedModule = await import(`../commands/${command}`);

			// oxlint-disable-next-line no-unsafe-type-assertion
			const typedModule = untypedModule as {
				default: Command;
			};

			return typedModule.default;
		})
	);
