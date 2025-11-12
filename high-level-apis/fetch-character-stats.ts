import type { APIEmbedField } from "discord.js";
import z from "zod";
import { cargoExport } from "../low-level-apis/cargo-export";

const fetchStatsGeneric = async ({
	character,
	tablePrefix,
	numberFields,
}: {
	character: string;
	tablePrefix: string;
	numberFields: string[];
}) => {
	const json = await cargoExport({
		tables: [`${tablePrefix}_CharacterData`],
		fields: numberFields,
		where: `chara = '${character}'`,
	});

	const schema = z.array(z.record(z.enum(numberFields), z.number())).length(1);
	const parsed = schema.parse(json);

	return Object.entries(parsed[0]).map(([key, value]) => ({
		name: key,
		value: String(value),
		inline: true,
	}));
};

const roa2 = (character: string) =>
	fetchStatsGeneric({
		character,
		tablePrefix: "ROA2",
		numberFields: [
			"Weight",
			"HitstunGravity",
			"FallSpeedMax",
			"DashSpeed",
			"RunSpeedMax",
			"FrictionGround",
		],
	});

const afqm = (character: string) =>
	fetchStatsGeneric({
		character,
		tablePrefix: "AFQM",
		numberFields: ["fastfall_speed", "jumpsquat_time", "max_fall_speed"],
	});

const nasb2 = (character: string) =>
	fetchStatsGeneric({
		character,
		tablePrefix: "NASB2",
		numberFields: [
			"DefaultWeight",
			"HitStunGravity",
			"HitStunFallSpeed",
			"RunSpeed",
			"MaxSpeed",
			"GroundFriction",
		],
	});

/**
 * SSBU was probably early in dragdown's life and has little to no values in cargo
 * and also uses wikitext as the type for most fields (become strings in any output)
 * so we can't use fetchStatsGeneric here
 */
const ssbu = async (character: string) => {
	const entrySchema = z.object({
		weight: z.string(),
		spotdodgetotal: z.string(),
		airdodgen: z.string(),
	});

	const json = await cargoExport({
		tables: ["SSBU_CharacterData"],
		fields: Object.keys(entrySchema.shape),
		where: `chara = '${character}'`,
	});

	const schema = z.array(entrySchema).length(1);
	const parsed = schema.parse(json);

	return Object.entries(parsed[0]).map(([key, value]) => ({
		name: key,
		value: String(value),
		inline: true,
	}));
};

const pplus = (character: string) =>
	fetchStatsGeneric({
		character,
		tablePrefix: "PPlus",
		numberFields: ["Weight", "Gravity", "TerminalVelocity"],
	});

export const fetchCharacterStats = (page: string): Promise<APIEmbedField[]> => {
	const [game, character] = page.split("/");

	switch (game.toLowerCase()) {
		case "roa2": {
			return roa2(character);
		}
		case "afqm": {
			return afqm(character);
		}
		case "nasb2": {
			return nasb2(character);
		}
		case "ssbu": {
			return ssbu(character);
		}
		case "pplus": {
			return pplus(character);
		}
		default: {
			throw new Error(`unsupported game ${game}`);
		}
	}
};
