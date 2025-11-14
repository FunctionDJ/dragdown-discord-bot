/**
 * shared stuff between fetch-full-glossary-entry and fetch-glossary-autocomplete
 */

export const glossaryGame = ["PPlus", "RoA2", "SSBU"] as const;

export const sanitizeForGlossaryQuery = (term: string) => {
	// in cargo, if the string to compare with contains the word of the field, it can break
	// that's why we're replacing "alias" with uppercase "ALIAS" which won't break the query.
	// i assume this only affects columns of type list (where you use HOLDS etc.) because it doesn't seem to break with e.g. `term = 'term'`.
	// for details, on mediawiki discord see https://discord.com/channels/178359708581625856/1438339313996922900
	const withoutAliasWord = term.replaceAll(/\Walias\W/gm, "ALIAS");

	// according to someone on mediawiki discord, the cargo API shouldn't be vulnerable to SQL injection,
	// but the query can still break if users insert the quote type that's used (in our case, single quotes).
	const withoutSingleQuotes = withoutAliasWord.replaceAll("'", "");
	return withoutSingleQuotes;
};
