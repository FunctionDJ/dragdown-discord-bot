import z from "zod";
import { cargoExport } from "../low-level-apis/cargo-export";
import type { GlossaryGame } from "./glossary-game";

/**
 * unlike fetchFullGlossaryEntry, this doesn't fetch data
 * that's unnecessary for autocomplete like alias or summary
 */
export const fetchGlossaryAutocomplete = async (
	game: GlossaryGame,
	term: string
) => {
	const entrySchema = z.object({
		term: z.string(),
		alias: z.string(),
	});

	const result = await cargoExport({
		tables: [game],
		fields: Object.keys(entrySchema.shape),
		where: `term LIKE '%${term}%' OR alias HOLDS LIKE '%${term}%'`,
		limit: 25,
	});

	const schema = z.array(entrySchema);

	return schema.parse(result).map((entry) => {
		if (entry.alias.trim() !== "") {
			return `${entry.term} alias ${entry.alias}`;
		}

		return entry.term;
	});
};
