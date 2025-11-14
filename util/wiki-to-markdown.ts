import TurndownService from "turndown";
import { decode } from "html-entities";

const turndownService = new TurndownService({
	codeBlockStyle: "fenced",
	emDelimiter: "*",
}).remove(
	(node) => node.tagName === "SPAN" && node.classList.contains("tooltiptext")
);

export const wikiToMarkdown = (text: string) => {
	const htmlEntitiesDecoded = decode(text);
	const modulesRemoved = htmlEntitiesDecoded.replaceAll(/\[\[.+?\]\]/gm, "");
	return turndownService.turndown(modulesRemoved);
};
