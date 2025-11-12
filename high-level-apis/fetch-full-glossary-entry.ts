import z from "zod";
import { cargoExport } from "../low-level-apis/cargo-export";
import type { GlossaryGame } from "./glossary-game";

const glossaryEntrySchema = z.object({
	term: z.string(),
	alias: z.string(),
	summary: z.string(),
});

export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;

export const fetchFullGlossaryEntry = async (
	game: GlossaryGame,
	term: string
) => {
	const result = await cargoExport({
		tables: [game],
		fields: Object.keys(glossaryEntrySchema.shape),
		where: `term LIKE '%${term}%' or alias HOLDS LIKE '%${term}%'`,
		limit: 100,
	});

	return z.array(glossaryEntrySchema).parse(result);
};
