import { fetchJSON } from "../fetch-json";
import type { CargoParams } from "./cargo-params";

/** uses `Special:CargoExport` instead of `api.php?action=cargoquery */
export const cargoExport = ({ tables, fields, where, limit }: CargoParams) =>
	fetchJSON("https://dragdown.wiki/Special:CargoExport", {
		tables: tables.join(","),
		fields: fields.join(","),
		where,
		limit,
	});
