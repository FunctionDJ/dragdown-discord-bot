import { fetchJSON } from "../fetch-json";
import type { CargoParams } from "./cargo-params";

export const cargoquery = (
	cookie: string,
	{ tables, fields, where, limit }: CargoParams
) =>
	fetchJSON(
		"https://dragdown.wiki/w/api.php",
		{
			action: "cargoquery",
			tables: tables.join(","),
			fields: fields.join(","),
			where,
			limit,
		},
		cookie
	);
