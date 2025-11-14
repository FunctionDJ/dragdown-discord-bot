import crypto from "node:crypto";

/**
 * https://commons.wikimedia.org/wiki/Commons:FAQ#What_are_the_strangely_named_components_in_file_paths?
 * @param {string} page a file name like "PPlus_Ike_Portrait.png".
 */
export const fileToStaticURL = (page: string) => {
	const withUnderscores = page.replaceAll(" ", "_");
	const md5 = crypto.hash("md5", withUnderscores);
	const firstChar = md5.slice(0, 1);
	const firstTwoChars = md5.slice(0, 2);
	return `https://static.wikitide.net/dragdownwiki/${firstChar}/${firstTwoChars}/${withUnderscores}`;
};
