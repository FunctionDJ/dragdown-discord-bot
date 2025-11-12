import z from "zod";
import { fetchJSON } from "../util/fetch-json";

export const fetchStockIconURL = async (page: string) => {
	const json = await fetchJSON("https://dragdown.wiki/w/api.php", {
		titles: `File:${page.replaceAll("/", "_")}_Stock.png`,
		prop: "imageinfo",
		iiprop: "url",
	});

	const schema = z.object({
		query: z.object({
			pages: z.record(
				z.string(),
				z.object({
					imageinfo: z.object({
						url: z.string(),
					}),
				})
			),
		}),
	});

	const parsed = schema.parse(json);

	return Object.values(parsed.query.pages)[0].imageinfo.url;
};
