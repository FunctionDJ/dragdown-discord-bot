import z from "zod";
import { fetchJSON } from "../fetchJSON";

export const fetchCharacter = async (name: string) => {
  const json = await fetchJSON("https://dragdown.wiki/w/api.php", {
    action: "query",
    titles: name,
    prop: "info|pageimages",
  });

  if ((json as any).query.pages["-1"] !== undefined) {
    return null;
  }

  const schema = z.object({
    query: z.object({
      pages: z.record(
        z.string(),
        z.object({
          pageId: z.int().optional(),
          title: z.string(),
          thumbnail: z.object({
            source: z.url(),
            width: z.int(),
            height: z.int(),
          }),
          pageimage: z.string(),
        })
      ),
    }),
  });

  return schema.parse(json);
};
