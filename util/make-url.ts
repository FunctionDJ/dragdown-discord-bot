export const makeURL = (
	endpoint: string,
	params: Record<string, string | number | null | undefined>
) => {
	const url = new URL(endpoint);

	Object.entries(params)
		.filter(([_key, value]) => value !== null && value !== undefined)
		.forEach(([keyof, value]) => {
			url.searchParams.set(keyof, String(value));
		});

	return url;
};
