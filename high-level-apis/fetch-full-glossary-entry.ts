import z from "zod";
import { cargoExport } from "../low-level-apis/cargo-export";
import { glossaryGame, sanitizeForGlossaryQuery } from "./glossary-shared";

export type GlossaryGame = (typeof glossaryGame)[number];

const glossaryEntrySchema = z.object({
	term: z.string(),
	alias: z.array(z.string()),
	summary: z.string(),
});

export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;

/** "ppluS" => "PPlus" */
export const getGlossaryGameByCaseInsensitive = (anyCasing: string) =>
	glossaryGame.find(
		(correctCasing) => correctCasing.toLowerCase() === anyCasing.toLowerCase()
	);

export const fetchFullGlossaryEntry = async (
	game: Lowercase<GlossaryGame>,
	term: string
) => {
	const result = await cargoExport({
		tables: [`Glossary_${getGlossaryGameByCaseInsensitive(game)}`],
		fields: Object.keys(glossaryEntrySchema.shape),
		where: `term LIKE '%${sanitizeForGlossaryQuery(
			term
		)}%' or alias HOLDS LIKE '%${sanitizeForGlossaryQuery(term)}%'`,
		limit: 100,
	});

	return z.array(glossaryEntrySchema).parse(result);
};
