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

interface CargoGlossaryEntry {
  title: {
    term: string;
    alias: string;
    summary: string;
  };
}

export const fetchGlossary = async (term: string) => {
  const result = (await dragdown.cargo({
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

export const glossaryComponents = (entry: CargoGlossaryEntry) => {
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
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const result = await fetchGlossary(interaction.options.getString("term")!);

    const exactMatch = result.find(
      (entry) =>
        entry.title.term.toLowerCase() ===
        interaction.options.getString("term")?.toLowerCase()
    );

    if (exactMatch === undefined || result.length > 1) {
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

      return;
    }

    await interaction.editReply({
      components: glossaryComponents(exactMatch ?? result[0]),
      flags: MessageFlags.IsComponentsV2,
    });
  },
} satisfies Command;
