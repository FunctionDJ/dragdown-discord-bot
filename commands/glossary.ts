import {
	ActionRowBuilder,
	ContainerBuilder,
	MessageFlags,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import {
	fetchFullGlossaryEntry,
	type GlossaryEntry,
} from "../util/apis/fetch-full-glossary-entry";
import { fetchGlossaryAutocomplete } from "../util/apis/fetch-glossary-autocomplete";
import { type Command } from "../util/command";
import { wikiToMarkdown } from "../util/wiki-to-markdown";

/**
 * TODO
 * - support for games other than P+
 * - nicer error/not-found replies with glossary page link
 */

const glossaryComponents = (entry: GlossaryEntry) => {
	const container = new ContainerBuilder().addTextDisplayComponents(
		(textDisplay) =>
			textDisplay.setContent(
				[
					`### ${entry.term}`,
					`Aliases: ${entry.alias}`,
					"",
					wikiToMarkdown(entry.summary),
					"",
					`[${
						entry.term
					} in glossary](https://dragdown.wiki/wiki/PPlus/Glossary#${entry.term.replaceAll(
						" ",
						"_"
					)}) — [Full glossary](https://dragdown.wiki/wiki/PPlus/Glossary)`,
				].join("\n")
			)
	);

	return [container];
};

export default {
	data: new SlashCommandBuilder()
		.setName("glossary")
		.setDescription("Lookup term in glossary")
		.addStringOption((option) =>
			option
				.setName("term")
				.setDescription("The term to look up")
				.setRequired(true)
				.setAutocomplete(true)
		),
	async execute(interaction) {
		await interaction.deferReply();

		const result = await fetchFullGlossaryEntry(
			"Glossary_PPlus",
			interaction.options.getString("term")!
		);

		const exactMatch = result.find(
			(entry) =>
				entry.term.toLowerCase() ===
				interaction.options.getString("term")?.toLowerCase()
		);

		if (result.length === 0) {
			await interaction.editReply(
				`\`${interaction.options.getString("term")}\` could not be found.`
			);
			return;
		}

		if (exactMatch !== undefined || result.length === 1) {
			await interaction.editReply({
				components: glossaryComponents(exactMatch ?? result[0]),
				flags: MessageFlags.IsComponentsV2,
			});

			return;
		}

		const select = new StringSelectMenuBuilder()
			.setCustomId("glossary-select")
			.setPlaceholder("Pick a search result")
			.addOptions(
				result.map((entry) =>
					new StringSelectMenuOptionBuilder()
						.setLabel(entry.term)
						.setDescription(wikiToMarkdown(entry.summary).slice(0, 100))
						.setValue(entry.term)
				)
			);

		await interaction.editReply({
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
			],
		});
	},
	stringSelectMenu: {
		customId: "glossary-select",
		async execute(interaction) {
			await interaction.deferUpdate();
			const entry = await fetchFullGlossaryEntry(
				"Glossary_PPlus",
				interaction.values[0]
			);

			if (entry.length === 0) {
				await interaction.editReply(
					`\`${interaction.values[0]}\` could not be found.`
				);
				return;
			}

			await interaction.editReply({
				components: glossaryComponents(entry[0]),
				flags: MessageFlags.IsComponentsV2,
			});
		},
	},
	async autocomplete(interaction) {
		const results = await fetchGlossaryAutocomplete(
			interaction.options.getString("term")!
		);

		await interaction.respond(
			results.map((term) => ({ name: term, value: term }))
		);
	},
} satisfies Command;
