import z from "zod";
import { fetchJSON } from "../util/fetch-json";

const twentyFourHours = 24 * 60 * 60 * 1000;

let cache: { timestamp: number; data: string[] } | null = null;

const fetchCharacterListCached = async () => {
	const now = Date.now();

	if (cache !== null && now - cache.timestamp < twentyFourHours) {
		return cache.data;
	}

	const json = await fetchJSON("https://dragdown.wiki/w/api.php", {
		action: "query",
		list: "categorymembers",
		cmtitle: "Category:Playable Character",
		cmlimit: 500,
		cmnamespace: 0, // mainspace
		cmtype: "page",
	});

	const schema = z.object({
		query: z.object({
			categorymembers: z.array(
				z.object({
					title: z.string(),
				})
			),
		}),
	});

	const parsed = schema.parse(json);

	const withoutCharacterSubPages = parsed.query.categorymembers
		.map((page) => page.title)
		.filter((title) => !/.*\/.*\/.*/gm.test(title));

	cache = { timestamp: now, data: withoutCharacterSubPages };
	return withoutCharacterSubPages;
};

export const searchPageByTitle = async (search: string) => {
	const characterList = await fetchCharacterListCached();

	return characterList
		.filter((pageTitle) =>
			pageTitle.toLowerCase().includes(search.toLowerCase())
		)
		.slice(0, 25); // 25 is max for discord autocomplete
};
