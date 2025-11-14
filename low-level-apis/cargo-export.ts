import { mw } from "./mw";

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
}: {
	tables: string[];
	/** this is readonly to allow passing "as const" arrays */
	fields: readonly string[];
	where?: string;
	limit?: number;
}) => {
	const response = await mw.rawRequest({
		baseURL: "https://dragdown.wiki/Special:CargoExport",
		params: {
			format: "json",
			formatversion: 2,
			tables: tables.join(","),
			fields: fields.join(","),
			where,
			limit,
		},
	});

	return response.data as unknown;
};
