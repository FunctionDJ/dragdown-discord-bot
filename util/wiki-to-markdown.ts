import TurndownService from "turndown";

const turndownService = new TurndownService({
	codeBlockStyle: "fenced",
	emDelimiter: "*",
}).remove(
	(node) => node.tagName === "SPAN" && node.classList.contains("tooltiptext"),
);

export const wikiToMarkdown = (text: string) => {
	const modulesRemoved = text.replaceAll(/\[\[.+?\]\]/gm, "");
	return turndownService.turndown(modulesRemoved);
};
