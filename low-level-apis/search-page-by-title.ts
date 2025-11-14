import { mw } from "./mw";

const twentyFourHours = 24 * 60 * 60 * 1000;

let cache: { timestamp: number; data: string[] } | null = null;

const fetchCharacterListCached = async () => {
	const now = Date.now();

	if (cache !== null && now - cache.timestamp < twentyFourHours) {
		return cache.data;
	}

	const response = await mw.getCategoryMembers("Category:Playable Character");

	const withoutCharacterSubPages = response
		.map((page) => page.title!)
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
