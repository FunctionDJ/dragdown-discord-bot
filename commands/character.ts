import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { fetchCharacter } from "../util/apis/fetchCharacter";
import { fetchCharacterStats } from "../util/apis/fetchCharacterStats";
import { fetchWikitext } from "../util/apis/fetchWikitext";
import { searchPageByTitle } from "../util/apis/searchPageByTitle";
import { Command } from "../util/command";
import { loginAndGetDragdownCached } from "../util/dragdown";

const dragdown = await loginAndGetDragdownCached();

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

    const [_interactionResponse, character, wikitext, stats] =
      await Promise.all([
        interaction.deferReply(),
        fetchCharacter(pageName),
        fetchWikitext(pageName),
        fetchCharacterStats(pageName),
      ]);

    const summaryRegex = /\|summary=([^|]*)?\|/gms.exec(wikitext);
    const summary = summaryRegex?.[1].trim().slice(0, 100);

    if (character === null) {
      await interaction.editReply(`\`${pageName}\` could not be found.`);
      return;
    }

    const page = Object.values(character.query.pages)[0];

    // useful: https://embed.dan.onl/
    const embed = new EmbedBuilder()
      .setAuthor({
        name: page.title,
        url: `https://dragdown.wiki/wiki/${page.title}`,
      })
      .setDescription("**" + page.title.split("/")[1] + "** " + summary)
      .addFields(stats)
      .setThumbnail(page.thumbnail.source);

    await interaction.editReply({ embeds: [embed] });
  },
  async autocomplete(interaction) {
    const result = await searchPageByTitle(
      interaction.options.getString("name")!
    );

    await interaction.respond(
      result.map((e) => ({ name: e.title, value: e.title }))
    );
  },
} satisfies Command;
