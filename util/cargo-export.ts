import { mw } from "./mw";

/**
 * TODO
 * revert the automatic wrapping because it makes wrapping the inner variable
 * with e.g. "%" very cringe, like `myfield LIKE ${`%${someVar}%`}`
 * when it could just be `myField LIKE '%${someVar}%'`
 */

/**
 * this is a tagged template function.
 *
 * imagine the following call:
 * ```sanitize`alias HOLDS LIKE ${someVar}` ```
 * with `someVar` being `foo alias`.
 *
 * this triggers a bug in cargo because the name of a list field ("alias")
 * is used in the string to compare to, e.g. it would normally result in
 * where = "alias HOLDS LIKE 'foo alias'".
 * the error is something like "you need to use HOLDS or HOLDS LIKE" etc.
 * for details, on mediawiki discord see https://discord.com/channels/178359708581625856/1438339313996922900 .
 *
 * how i'm working around this:
 * we're gonna store all words in the "where" that are from string literals (not variables)
 * except some keywords like "and", "or", "holds", "like" because
 * i hope they're not allowed as field names anyways.
 * next, we go through every variable and replace every occurance of a
 * stored word with it's uppercase counterpart, which dodges the bug.
 *
 * finally, we remove all single quotes from variables to reduce the chance of
 * accidentially breaking queries and then we wrap
 * each variable in single quotes here for convenience.
 *
 * @example sanitize`alias HOLDS LIKE ${someVar}`
 */
export const sanitizeFunction = (
	literals: TemplateStringsArray,
	...variables: string[]
) => {
	const wordsInLiterals = literals
		.flatMap((str) => str.match(/\b\w+\b/g) ?? [])
		.filter((word) => !["and", "or", "holds", "like"].includes(word));

	let output = "";

	// oxlint-disable-next-line id-length
	for (let i = 0; i < literals.length; i++) {
		const variableWithWordsInLiteralsUppercased = wordsInLiterals.reduce(
			(prev, cur) =>
				prev?.replaceAll(new RegExp(`\b${cur}\b`, "g"), (match) =>
					match.toUpperCase()
				) ?? "",
			variables[i]
		);

		const withoutSingleQuotes =
			variableWithWordsInLiteralsUppercased.replaceAll("'", "");

		if (withoutSingleQuotes === "") {
			// so that we don't add extra single quotes
			output += literals[i];
		} else {
			output += `${literals[i]}'${withoutSingleQuotes}'`;
		}
	}

	return output;
};

/**
 * uses `Special:CargoExport` instead of `api.php?action=cargoquery`.
 * doesn't allow for CREATE, UPDATE, DELETE, unlike action=cargoquery.
 * but cargoquery requires authentication
 * and mwbot-ts doesn't have a method for it anyway.
 */
export const cargoExport = async ({
	tables,
	fields,
	where,
	limit,
	orderBy,
}: {
	tables: string[];
	/** this is readonly to allow passing "as const" arrays */
	fields: readonly string[];
	where?: (sanitize: typeof sanitizeFunction) => string;
	limit?: number;
	orderBy?: string;
}) => {
	const response = await mw.rawRequest({
		baseURL: "https://dragdown.wiki/Special:CargoExport",
		params: {
			format: "json",
			formatversion: 2,
			tables: tables.join(","),
			fields: fields.join(","),
			where: where?.(sanitizeFunction),
			limit,
			orderBy,
		},
	});

	return response.data as unknown;
};
