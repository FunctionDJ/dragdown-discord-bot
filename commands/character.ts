import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { fetchCharacter } from "../high-level-apis/fetch-character";
import { fetchCharacterStats } from "../high-level-apis/fetch-character-stats";
import { fetchStockIconURL } from "../high-level-apis/fetch-stock-icon-url";
import { fetchWikitext } from "../low-level-apis/fetch-wikitext";
import { searchPageByTitle } from "../low-level-apis/search-page-by-title";
import type { Command } from "../util/command";

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
	async execute(interaction) {
		const pageName = interaction.options.getString("name")!;

		const [_interactionResponse, character, wikitext, stats, stockIcon] =
			await Promise.all([
				interaction.deferReply(),
				fetchCharacter(pageName),
				fetchWikitext(pageName),
				fetchCharacterStats(pageName),
				fetchStockIconURL(pageName),
			]);

		const summaryRegex = /\|summary=([^|]*)?\|/gms.exec(wikitext);
		const summary = summaryRegex?.[1].trim().slice(0, 100);

		if (character === null) {
			await interaction.editReply(`\`${pageName}\` could not be found.`);
			return;
		}

		const [page] = Object.values(character.query.pages);

		// useful: https://embed.dan.onl/
		const embed = new EmbedBuilder()
			.setAuthor({
				name: page.title,
				url: `https://dragdown.wiki/wiki/${page.title}`,
				iconURL: stockIcon,
			})
			.setDescription(`**${page.title.split("/")[1]}** ${summary}`)
			.addFields(stats)
			.setThumbnail(page.thumbnail.source);

		await interaction.editReply({ embeds: [embed] });
	},
	async autocomplete(interaction) {
		const result = await searchPageByTitle(
			interaction.options.getString("name")!
		);

		await interaction.respond(
			result.map((entry) => ({ name: entry, value: entry }))
		);
	},
} satisfies Command;
