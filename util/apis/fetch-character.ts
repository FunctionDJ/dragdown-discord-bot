import z from "zod";
import { fetchJSON } from "../fetch-json";

export const fetchCharacter = async (name: string) => {
	const json = await fetchJSON("https://dragdown.wiki/w/api.php", {
		action: "query",
		titles: name,
		prop: "info|pageimages",
	});

	const schema = z.object({
		query: z.object({
			pages: z.record(
				z.string(),
				z.object({
					pageId: z.int().optional(),
					title: z.string(),
					thumbnail: z.object({
						source: z.url(),
						width: z.int(),
						height: z.int(),
					}),
					pageimage: z.string(),
				})
			),
		}),
	});

	const parsed = schema.parse(json);

	if (parsed.query.pages["-1"] !== undefined) {
		// if page "-1" is specified in the response, it means "not found"
		return null;
	}

	return parsed;
};
