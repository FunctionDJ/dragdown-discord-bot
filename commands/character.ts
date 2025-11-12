import { MessageFlags, SectionBuilder, SlashCommandBuilder } from "discord.js";
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
    await interaction.deferReply();

    const result = await dragdown.character(
      interaction.options.getString("name")!
    );

    const wikitext = await dragdown.wikitext(
      interaction.options.getString("name")!
    );

    const summaryRegex = /\|summary=([^|]*)?\|/gms.exec(wikitext);
    const summary = summaryRegex?.[1].trim().slice(0, 100);

    if (result === null) {
      await interaction.editReply(
        `\`${interaction.options.getString("name")}\` could not be found.`
      );
      return;
    }

    const page = Object.values(result.query.pages)[0];

    const section = new SectionBuilder()
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          [
            `### ${page.title}`,
            "",
            `**${
              interaction.options.getString("name")!.split("/")[1]
            }** ${summary}`,
            // wikiToMarkdown(page.extract).slice(0, 300), // TODO if overview longer than 300 chars or something, add "... [Show more](link)"
            "",
            `[${page.title}](${page.canonicalurl})`,
          ].join("\n")
        )
      )
      .setThumbnailAccessory((thumbnail) =>
        thumbnail.setURL(page.thumbnail.source).setDescription(page.pageimage)
      );

    await interaction.editReply({
      components: [section],
      flags: MessageFlags.IsComponentsV2,
    });
  },
  async autocomplete(interaction) {
    const result = await dragdown.searchPageByTitle(
      interaction.options.getString("name")!
    );

    await interaction.respond(
      result.map((e) => ({ name: e.title, value: e.title }))
    );
  },
} satisfies Command;
