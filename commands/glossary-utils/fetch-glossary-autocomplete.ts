import type { ApplicationCommandOptionChoiceData } from "discord.js";
import z from "zod";
import { cargoExport } from "../../util/cargo-export";
import { glossaryGame } from "./glossary-shared";

const entrySchema = z.object({
	term: z.string().or(z.number()),
	alias: z.array(z.string().trim()),
});

/**
 * unlike fetchFullGlossaryEntry, this doesn't fetch data
 * that's unnecessary for autocomplete like alias or summary
 */
export const fetchGlossaryAutocomplete = async (term: string) => {
	const resultSets = await Promise.all(
		glossaryGame.map(async (game) => {
			const results = await cargoExport({
				tables: [`Glossary_${game}`],
				fields: Object.keys(entrySchema.shape),
				where: (san) =>
					san`term LIKE ${`%${term}%`} OR alias HOLDS LIKE ${`%${term}%`}`,
				/**
				 * max for autocomplete, though we're querying all glossaries,
				 * so total will often be >25 which we need to trim later,
				 * but we never need more than 25 from any game glossary.
				 */
				limit: 25,
			});

			const parsed = z.array(entrySchema).parse(results);

			return parsed.map((entry) => ({
				term: entry.term,
				alias: entry.alias.filter((alias) => alias !== ""),
				game,
			}));
		})
	);

	return resultSets
		.flat()
		.slice(0, 25) // max for discord autocomplete
		.map<ApplicationCommandOptionChoiceData>((entry) => {
			// termPath is not a real thing on dragdown itself, this just helps users know which glossary a term belongs to.
			const termPath = `${entry.game}/${entry.term}`;

			if (entry.alias.length > 0) {
				return {
					name: `${termPath} — alias ${entry.alias.join(", ")}`,
					value: termPath,
				};
			}

			return {
				name: termPath,
				value: termPath,
			};
		});
};
