import {
  ActionRowBuilder,
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { Command } from "../util/command";
import { loginAndGetDragdownCached } from "../util/dragdown";
import { wikiToMarkdown } from "../util/wikiToMarkdown";

const dragdown = await loginAndGetDragdownCached();

/**
 * TODO
 * - support for games other than P+
 * - search also in alias field, not just term
 * - nicer error/not-found replies with glossary page link
 */

interface CargoGlossaryEntry {
  title: {
    term: string;
    alias: string;
    summary: string;
  };
}

const fetchGlossary = async (term: string) => {
  const result = (await dragdown.cargoquery({
    tables: ["Glossary_PPlus"],
    fields: [
      "Glossary_PPlus.term",
      "Glossary_PPlus.alias",
      "Glossary_PPlus.summary",
    ],
    where: `Glossary_PPlus.term LIKE '%${term}%'`,
    /**
       *  or Glossary_PPlus.alias LIKE '%${interaction.options.getString(
        "term"
      )}%'
       */
    limit: 100,
  })) as CargoGlossaryEntry[];

  return result;
};

const glossaryComponents = (entry: CargoGlossaryEntry) => {
  const container = new ContainerBuilder()
    .setAccentColor(0x0099ff)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        [
          `### ${entry.title.term}`,
          `Aliases: ${entry.title.alias}`,
          "",
          wikiToMarkdown(entry.title.summary),
          "",
          `[${
            entry.title.term
          } in glossary](https://dragdown.wiki/wiki/PPlus/Glossary#${entry.title.term.replaceAll(
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

    const result = await fetchGlossary(interaction.options.getString("term")!);

    const exactMatch = result.find(
      (entry) =>
        entry.title.term.toLowerCase() ===
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
            .setLabel(entry.title.term)
            .setDescription(wikiToMarkdown(entry.title.summary).slice(0, 100))
            .setValue(entry.title.term)
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
      const entry = await fetchGlossary(interaction.values[0]);

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
    const result = (await dragdown.cargoquery({
      tables: ["Glossary_PPlus"],
      fields: ["Glossary_PPlus.term"],
      where: `Glossary_PPlus.term LIKE '%${interaction.options.getString(
        "term"
      )}%'`,
      limit: 25,
    })) as { title: { term: string } }[];

    await interaction.respond(
      result.map((c) => ({ name: c.title.term, value: c.title.term }))
    );
  },
} satisfies Command;
