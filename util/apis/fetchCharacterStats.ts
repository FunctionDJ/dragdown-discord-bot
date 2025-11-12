import { APIEmbedField } from "discord.js";
import { cargoExport } from "./cargoExport";
import z from "zod";

export const fetchCharacterStats = async (
  page: string
): Promise<APIEmbedField[]> => {
  const [game, character] = page.split("/");

  switch (game.toLowerCase()) {
    case "roa2": {
      const json = await cargoExport({
        tables: ["ROA2_CharacterData"],
        fields: [
          "Weight",
          "HitstunGravity",
          "FallSpeedMax",
          "DashSpeed",
          "RunSpeedMax",
          "FrictionGround",
        ],
        where: `chara = '${character}'`,
      });

      const schema = z
        .array(
          z.object({
            Weight: z.number(),
            HitstunGravity: z.number(),
            FallSpeedMax: z.number(),
            DashSpeed: z.number(),
            RunSpeedMax: z.number(),
            FrictionGround: z.number(),
          })
        )
        .length(1);

      const parsed = schema.parse(json);

      return Object.entries(parsed[0]).map(([key, value]) => ({
        name: key,
        value: String(value),
        inline: true,
      }));
    }
    default: {
      throw new Error(`unsupported game ${game}`);
    }
  }
};
