import { makeURL } from "./make-url";

export const fetchJSON = async (
	endpoint: string,
	params: Record<string, string | number | null | undefined>,
	cookie?: string
) => {
	const url = makeURL(endpoint, {
		format: "json",
		...params,
	});

	const response = await fetch(url, {
		headers: {
			cookie: cookie ?? "",
		},
	});

	return response.json() as unknown;
};
