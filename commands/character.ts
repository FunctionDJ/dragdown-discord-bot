import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { fetchCharacterStats } from "../high-level-apis/fetch-character-stats";
import { fileToStaticURL } from "../low-level-apis/file-to-static-url";
import { mw } from "../low-level-apis/mw";
import { searchPageByTitle } from "../low-level-apis/search-page-by-title";
import type { Command } from "../util/command";
import { ellipsis } from "../util/ellipsis";
import { spacer } from "../util/spacer";

/**
 * TODO
 * /character is supposed to post custom stats too, but currently the wikitext and resulting HTML
 * is different between games and will be very fiddly regardless so i'm skipping it for now.
 * right now, /character has custom cargo queries for stats for each game, so per-character custom properties
 * are not implemented right now.
 */

export default {
	data: new SlashCommandBuilder()
		.setName("character")
		.setDescription("Lookup basic character info")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("The character to look up")
				.setRequired(true)
				.setAutocomplete(true)
		),
	// oxlint-disable-next-line max-lines-per-function
	async execute(interaction) {
		const pageName = interaction.options.getString("name", true);

		/**
		 * TOOD
		 * handle if any component could not be found
		 */

		const wikitextPromise = mw
			.parse({
				prop: "wikitext",
				page: pageName,
			})
			.then((res) => res.wikitext);

		const subPagesPromise = mw
			.search(pageName, {
				srwhat: "title",
			})
			.then(({ search }) =>
				search
					.map(({ title }) => title)
					.filter((title) => !title.endsWith("/Data") && title !== pageName)
			);

		const [
			_interactionResponse,
			wikitext,
			stats,
			subPages,
			// htmlDocument,
		] = await Promise.all([
			interaction.deferReply(),
			wikitextPromise,
			fetchCharacterStats(pageName),
			subPagesPromise,
			// fetchHTML(pageName),
		]);

		const summaryRegex = /\|summary=([^|]*)?\|/gms.exec(wikitext!);
		const summary = ellipsis(500, summaryRegex?.[1].trim()!);

		// const htmlBasedStats: APIEmbedField[] = [];

		// htmlDocument(".CharaInfoLabel").each((_num, elem) => {
		// 	htmlBasedStats.push({
		// 		name: htmlDocument(elem).text().trim(),
		// 		value: htmlDocument(elem).next().text().trim(),
		// 	});
		// });

		// useful: https://embed.dan.onl/
		const embed = new EmbedBuilder()
			.setAuthor({
				name: pageName,
				url: `https://dragdown.wiki/wiki/${pageName}`,
				iconURL: fileToStaticURL(`${pageName}_Stock.png`),
			})
			.setDescription(
				[
					`**${pageName.split("/")[1]}** ${summary}`,
					"",
					subPages
						.map(
							(subPage) =>
								`[${subPage.slice(
									pageName.length + 1
								)}](https://dragdown.wiki/wiki/${subPage.replaceAll(" ", "_")})`
						)
						.join(`${spacer}●${spacer}`),
				].join("\n")
			)
			.addFields(stats)
			.setThumbnail(fileToStaticURL(`${pageName}_Portrait.png`));

		await interaction.editReply({ embeds: [embed] });
	},
	async autocomplete(interaction) {
		const result = await searchPageByTitle(
			interaction.options.getString("name", true)
		);

		await interaction.respond(
			result.map((entry) => ({ name: entry, value: entry }))
		);
	},
} satisfies Command;
