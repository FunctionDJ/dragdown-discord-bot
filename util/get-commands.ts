import type { Command } from "./command";
import fs from "node:fs";

export const getCommands = () =>
	Promise.all(
		fs
			.readdirSync("./commands", { withFileTypes: true })
			.filter((dirEnt) => dirEnt.isFile())
			.map(async (dirEnt) => {
				// oxlint-disable-next-line no-unsafe-assignment
				const untypedModule = await import(`../commands/${dirEnt.name}`);

				// oxlint-disable-next-line no-unsafe-type-assertion
				const typedModule = untypedModule as {
					default: Command;
				};

				return typedModule.default;
			})
	);
