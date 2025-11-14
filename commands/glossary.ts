import {
	ContainerBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import z from "zod";
import {
	fetchFullGlossaryEntry,
	getGlossaryGameByCaseInsensitive,
	type GlossaryEntry,
	type GlossaryGame,
} from "../high-level-apis/fetch-full-glossary-entry";
import { fetchGlossaryAutocomplete } from "../high-level-apis/fetch-glossary-autocomplete";
import { glossaryGame } from "../high-level-apis/glossary-shared";
import { type Command } from "../util/command";
import { wikiToMarkdown } from "../util/wiki-to-markdown";
import { ellipsis } from "../util/ellipsis";

/**
 * TODO
 * - nicer error/not-found replies with glossary page link
 */

const glossaryComponents = (game: string, entry: GlossaryEntry) => {
	const gameWithCorrectCase = getGlossaryGameByCaseInsensitive(game);

	const link = `https://dragdown.wiki/wiki/${gameWithCorrectCase}/Glossary#${entry.term.replaceAll(
		" ",
		"_"
	)}`;

	const container = new ContainerBuilder().addTextDisplayComponents(
		(textDisplay) =>
			textDisplay.setContent(
				[
					`### [${entry.term}](${link}) — ${gameWithCorrectCase}`,
					`Aliases: ${entry.alias
						.map((alias) => alias.trim())
						.filter(Boolean)
						.join(", ")}`,
					"",
					ellipsis(3500, wikiToMarkdown(entry.summary)),
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
	// oxlint-disable-next-line max-lines-per-function
	async execute(interaction) {
		await interaction.deferReply();

		const [game, term] = interaction.options.getString("term", true).split("/");

		const schema = z.preprocess(
			(str: string) => str.toLowerCase(),
			z.enum(glossaryGame.map((str) => str.toLowerCase()))
		);

		const gameParseResult = schema.safeParse(game);
		const termParseResult = z.string().min(1).safeParse(term);

		if (!gameParseResult.success || !termParseResult.success) {
			await interaction.editReply(
				`Error: Term must match the pattern \`game/term\` with \`game\` being one of \`${glossaryGame.join(
					" | "
				)}\` (case-insensitive)`
			);
			return;
		}

		// removes everything after emdash (used to separate aliases in autocomplete)
		const termWithoutAliases = termParseResult.data.split("—")[0].trim();

		const result = await fetchFullGlossaryEntry(
			// oxlint-disable-next-line no-unsafe-type-assertion
			gameParseResult.data.toLowerCase() as Lowercase<GlossaryGame>,
			termWithoutAliases
		);

		const exactMatch = result.find(
			(entry) => entry.term.toLowerCase() === termWithoutAliases.toLowerCase()
		);

		if (result.length === 0) {
			await interaction.editReply(
				`Error: \`${interaction.options.getString(
					"term"
				)}\` could not be found.`
			);
			return;
		}

		/**
		 * TODO
		 * handle not exact match as error
		 */

		if (exactMatch !== undefined || result.length === 1) {
			await interaction.editReply({
				components: glossaryComponents(
					gameParseResult.data,
					exactMatch ?? result[0]
				),
				flags: MessageFlags.IsComponentsV2,
			});

			return;
		}
	},
	async autocomplete(interaction) {
		await interaction.respond(
			await fetchGlossaryAutocomplete(
				interaction.options.getString("term", true)
			)
		);
	},
} satisfies Command;
