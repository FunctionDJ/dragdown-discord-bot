import z from "zod";
import { cargoExport } from "./cargo-export";

/**
 * TODO
 * search in alias too, not just term
 */

/**
 * unlike fetchFullGlossaryEntry, this doesn't fetch data
 * that's unnecessary for autocomplete like alias or summary
 */
export const fetchGlossaryAutocomplete = async (term: string) => {
	const result = await cargoExport({
		tables: ["Glossary_PPlus"],
		fields: ["Glossary_PPlus.term"],
		where: `Glossary_PPlus.term LIKE '%${term}%'`,
		limit: 25,
	});

	const schema = z.array(z.object({ term: z.string() }));
	return schema.parse(result).map((entry) => entry.term);
};
