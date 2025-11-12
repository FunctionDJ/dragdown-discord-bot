import { fetchJSON } from "../fetchJSON";
import { CargoParams } from "./CargoParams";

/** uses `Special:CargoExport` instead of `api.php?action=cargoquery */
export const cargoExport = async ({
  tables,
  fields,
  where,
  limit,
}: CargoParams) =>
  fetchJSON("https://dragdown.wiki/Special:CargoExport", {
    tables: tables.join(","),
    fields: fields.join(","),
    where,
    limit,
  });
