export const fetchWikitext = async (page: string) => {
	const response = await fetch(`https://dragdown.wiki/wiki/${page}?action=raw`);
	return response.text();
};
