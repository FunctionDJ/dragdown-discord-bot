import z from "zod";
import { fetchJSON } from "../fetch-json";

export const searchPageByTitle = async (pageTitle: string) => {
	const json = await fetchJSON("https://dragdown.wiki/w/api.php", {
		action: "query",
		srwhat: "title",
		list: "search",
		srsearch: `PPlus/${pageTitle}`,
		srprops: "",
		srlimit: 25, // max of discord autocomplete
	});

	const schema = z.object({
		query: z.object({
			searchinfo: z.object({
				totalhits: z.int(),
			}),
			search: z.array(
				z.object({
					title: z.string(),
				})
			),
		}),
	});

	const parsed = schema.parse(json);

	return parsed.query.search.filter(
		(pageTitle) => !pageTitle.title.endsWith("/Data")
	);
};
