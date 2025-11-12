import { fetchJSON } from "../fetchJSON";
import { CargoParams } from "./CargoParams";

export const cargoquery = async (
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
