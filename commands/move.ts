import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../util/command";
import { searchPageByTitle } from "../util/search-page-by-title";
import { mw } from "../util/mw";
import { cargoExportValidate } from "../util/cargo-export-validate";
import z from "zod";
import { fileToStaticURL } from "../util/file-to-static-url";
import { spacer } from "../util/spacer";
import { wikiToMarkdown } from "../util/wiki-to-markdown";
import { getFrameDisplay } from "./move-utils/frame-display";

const rangesStringSchema = z.unknown().transform((data) => {
	if (data === null) {
		return null;
	}

	if (typeof data === "number") {
		return [data];
	}

	if (typeof data === "string") {
		const rangesStrings = data.split(",").map((str) => str.trim());

		return rangesStrings.map((rangeString) => {
			if (/\d+/.test(data)) {
				return Number.parseFloat(data);
			}

			if (/\d+-\d+/.test(data)) {
				const [from, to] = data.split("-");
				return { from: Number.parseFloat(from), to: Number.parseFloat(to) };
			}

			throw new TypeError(
				`Can't parse this particular rangeString "${rangeString}"`
			);
		});
	}

	throw new TypeError(`Can't parse rangesString, typeof: "${typeof data}"`);
});

const roa2Attacks = [
	"Jab",
	"Forward Tilt",
	"Up Tilt",
	"Down Tilt",
	"Dash Attack",
	"Forward Strong",
	"Up Strong",
	"Down Strong",
	"Neutral Air",
	"Forward Air",
	"Back Air",
	"Up Air",
	"Down Air",
	"Neutral Special",
	"Forward Special",
	"Up Special",
	"Down Special",
	"Grab",
	"Pummel Attack",
	"Pummel Special",
	"Forward Throw",
	"Back Throw",
	"Up Throw",
	"Down Throw",
	"Ledge Attack",
	"Ledge Special",
	"Getup Attack",
	"Getup Special",
];

const pplusAttacks = [
	"Jab",
	"Forward Tilt",
	"Up Tilt",
	"Down Tilt",
	"Dash Attack",
	"Forward Smash",
	"Up Smash",
	"Down Smash",
	"Neutral Air",
	"Forward Air",
	"Back Air",
	"Up Air",
	"Down Air",
	"Neutral Special",
	"Forward Special",
	"Up Special",
	"Down Special",
	"Grab",
	"Pummel",
	"Forward Throw",
	"Back Throw",
	"Up Throw",
	"Down Throw",
	"Ledge Attack (Fast)",
	"Ledge Attack (Slow)",
	"Getup Attack (Up)",
	"Getup Attack (Down)",
];

const gameAttacksMap: Record<string, string[]> = {
	pplus: pplusAttacks,
	roa2: roa2Attacks,
};

const formatWikitext = (value: string | number | null): string => {
	if (value === null) {
		return "N/A";
	}

	return wikiToMarkdown(String(value));
};

export default {
	data: new SlashCommandBuilder()
		.setName("move")
		.setDescription("Lookup move info")
		.addStringOption((option) =>
			option
				.setName("character")
				.setDescription("'Game/Character'")
				.setRequired(true)
				.setAutocomplete(true)
		)
		.addStringOption((option) =>
			option
				.setName("attack")
				.setDescription("Name of the attack")
				.setRequired(true)
				.setAutocomplete(true)
		),
	// oxlint-disable-next-line max-lines-per-function
	async execute(interaction) {
		await interaction.deferReply();

		const pageTitle = interaction.options.getString("character", true);

		const page = await mw.parse({
			page: pageTitle,
			prop: "wikitext",
		});

		const [attackSection] = new mw.Wikitext(page.wikitext!).parseSections({
			sectionPredicate: (section) =>
				section.title.includes(interaction.options.getString("attack", true)),
		});

		/**
		 * TODO make it work with all games, not just ROA
		 */

		const [moveCard] = new mw.Wikitext(attackSection.content).parseTemplates({
			titlePredicate: (title) => {
				if (typeof title === "string") {
					return title === "RoA2_Move_Card_New";
				}

				return title.getMain() === "RoA2_Move_Card_New";
			},
		});

		const { params } = moveCard;

		if (Array.isArray(params)) {
			throw new TypeError("moveCard params are unexpectedly an array");
		}

		const attack = params.attack.value;
		const description = params.description.value;

		const [_game, character] = pageTitle.split("/");

		const wikitextSchema = z.string().or(z.number()).nullable();
		const wikitextListSchema = z.array(wikitextSchema);

		const [modes] = await cargoExportValidate({
			tables: ["ROA2_MoveMode"],
			rowSchema: z.object({
				image: z.array(z.string()),
				startup: wikitextSchema,
				totalActive: wikitextSchema,
				endlag: wikitextSchema,
				cancel: wikitextSchema,
				landingLag: wikitextSchema,
				totalDuration: wikitextSchema,
				hitID: wikitextListSchema,
				hitName: wikitextListSchema,
				hitActive: wikitextListSchema,
				customShieldSafety: wikitextListSchema,
				uniqueField: wikitextListSchema,
			}),
			where: (san) => san`chara = ${character} and attack = ${attack}`,
			orderBy: "_ID",
		});

		const totalActiveRanges = rangesStringSchema.parse(modes.totalActive);

		const frameDisplay = getFrameDisplay({
			totalDuration,
			totalActiveRanges,
			endLag: modes.endlag,
			startup: modes.startup,
		});

		let embedDescription = wikiToMarkdown(description);

		if (frameDisplay !== null) {
			embedDescription += `\n-# ${frameDisplay}`;
		}

		const embed = new EmbedBuilder()
			.setAuthor({
				name: `${attack}${spacer}●${spacer}${pageTitle}`,
				url: `https://dragdown.wiki/wiki/${pageTitle}#${attack}`,
			})
			.setDescription(embedDescription)
			.addFields(
				{ name: "Startup", value: formatWikitext(modes.startup) },
				{ name: "Total Active", value: formatWikitext(modes.totalActive) },
				{ name: "Endlag", value: formatWikitext(modes.endlag) },
				{ name: "Cancels", value: formatWikitext(modes.endlag) },
				{ name: "Landing Lag", value: formatWikitext(modes.endlag) },
				{ name: "Total Duration", value: formatWikitext(modes.endlag) }
			)
			.setThumbnail(fileToStaticURL(`${pageTitle}_${attack}_0.png`));

		await interaction.editReply({ embeds: [embed] });
	},
	async autocomplete(interaction) {
		const focused = interaction.options.getFocused(true);

		switch (focused.name) {
			case "character": {
				const result = await searchPageByTitle(
					interaction.options.getString("character", true)
				);

				await interaction.respond(
					result.map((entry) => ({ name: entry, value: entry }))
				);

				break;
			}
			case "attack": {
				const pageTitle = interaction.options.getString("character", true);
				const [game] = pageTitle.split("/");
				const gameLowerCase = game.toLowerCase();

				const attacks = gameAttacksMap[gameLowerCase];

				if (attacks === undefined) {
					await interaction.respond([
						{ name: `Game '${game}' is unsupported`, value: "" },
					]);

					return;
				}

				await interaction.respond(
					attacks
						.filter((attack) =>
							attack
								.toLowerCase()
								.includes(interaction.options.getString("attack", true))
						)
						.slice(0, 25)
						.map((attack) => ({ name: attack, value: attack }))
				);

				break;
			}
		}
	},
} satisfies Command;
