import z from "zod";
import { cargoExport } from "./cargo-export";

/**
 * TODO
 * - search also in alias field, not just term
 */

type Game = "Glossary_PPlus" | "Glossary_RoA2" | "Glossary_SSBU";

const glossaryEntrySchema = z.object({
	term: z.string(),
	alias: z.string(),
	summary: z.string(),
});

export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;

export const fetchFullGlossaryEntry = async (game: Game, term: string) => {
	const result = await cargoExport({
		tables: [game],
		fields: ["term", "alias", "summary"],
		where: `term LIKE '%${term}%'`,
		/**
       *  or alias LIKE '%${interaction.options.getString(
        "term"
      )}%'
       */
		limit: 100,
	});

	return z.array(glossaryEntrySchema).parse(result);
};
