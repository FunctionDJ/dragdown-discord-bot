import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	StringSelectMenuInteraction,
} from "discord.js";

export interface Command {
	data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
	execute(interaction: ChatInputCommandInteraction): Promise<void>;
	autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
	stringSelectMenu?: {
		customId: string;
		execute(interaction: StringSelectMenuInteraction): Promise<void>;
	};
}
