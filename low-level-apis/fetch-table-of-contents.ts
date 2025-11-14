import { mw } from "./mw";

/**
 * unused as of writing.
 */
export const fetchTableOfContents = async (page: string) => {
	const pageObj = await mw.parse({
		page,
		prop: "sections",
	});

	return pageObj.sections;
};
