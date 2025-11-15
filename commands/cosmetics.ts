import {
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { fileToStaticURL } from "../util/file-to-static-url";
import { mw } from "../util/mw";
import { searchPageByTitle } from "../util/search-page-by-title";
import { type Command } from "../util/command";

/**
 * TODO
 * i don't really know how to make a nicer interface in discord right now.
 * so right now it just dumps the first 10 (discord limit) [[File:whatever]]
 * that it finds in the "== Cosmetics ==" section.
 */

export default {
	data: new SlashCommandBuilder()
		.setName("cosmetics")
		.setDescription("Lookup costumes/skins")
		.addStringOption((option) =>
			option
				.setName("character")
				.setDescription("The character to look up")
				.setRequired(true)
				.setAutocomplete(true)
		),
	async execute(interaction) {
		await interaction.deferReply();

		const page = await mw.parse({
			page: interaction.options.getString("character", true),
			prop: "wikitext",
		});

		const wikitext = new mw.Wikitext(page.wikitext!);

		const [cosmeticsSection] = wikitext.parseSections({
			sectionPredicate: (section) =>
				section.level === 2 && section.title.toLowerCase() === "cosmetics",
		});

		const wikilinks = new mw.Wikitext(
			cosmeticsSection.content
		).parseWikilinks();

		const first10Costumes = wikilinks.slice(0, 10).map((thing) => {
			if (typeof thing.title === "string") {
				return fileToStaticURL(thing.title);
			}

			return fileToStaticURL(thing.title.getMain());
		});

		const gallery = new MediaGalleryBuilder().addItems(
			first10Costumes.map(
				(costume) => new MediaGalleryItemBuilder({ media: { url: costume } })
			)
		);

		await interaction.editReply({
			components: [gallery],
			flags: MessageFlags.IsComponentsV2,
		});
	},
	async autocomplete(interaction) {
		const result = await searchPageByTitle(
			interaction.options.getString("character", true)
		);

		await interaction.respond(
			result.map((entry) => ({ name: entry, value: entry }))
		);
	},
} satisfies Command;
