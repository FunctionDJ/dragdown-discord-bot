import z from "zod";

const endpoint = "https://dragdown.wiki/w/api.php";

const pageQuerySchema = z.object({
  query: z.object({
    pages: z.record(
      z.string(),
      z.object({
        pageId: z.int().optional(),
        title: z.string(),
        canonicalurl: z.url(),
        extract: z.string(),
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

const makeUrl = (
  params: Record<string, string | number | null | undefined>
) => {
  const url = new URL(endpoint);
  url.searchParams.set("format", "json");

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
};

const loginAndGetDragdown = async () => {
  const loginTokenResponse = await fetch(
    `${endpoint}?action=query&format=json&meta=tokens&type=login`
  );

  const loginResponse = await fetch(endpoint, {
    method: "POST",
    body: new URLSearchParams([
      ["action", "login"],
      ["lgname", process.env.DRAGDOWN_BOT_USERNAME!],
      ["lgpassword", process.env.DRAGDOWN_BOT_PASSWORD!],
      ["lgtoken", (await loginTokenResponse.json()).query.tokens.logintoken],
    ]),
    headers: {
      cookie: loginTokenResponse.headers.get("set-cookie")!,
    },
  });

  return {
    async cargo({
      tables,
      fields,
      where,
      limit,
    }: {
      tables: string[];
      fields: string[];
      where?: string;
      limit?: number;
    }) {
      const response = await fetch(
        makeUrl({
          action: "cargoquery",
          tables: tables.join(","),
          fields: fields.join(","),
          where,
          limit,
        }),
        {
          headers: {
            cookie: loginResponse.headers.get("set-cookie")!,
          },
        }
      );

      const json = await response.json();
      return json.cargoquery;
    },
    async character(name: string) {
      const url = makeUrl({
        action: "query",
        titles: name,
        prop: "info|extracts|pageimages",
        inprop: "url",
      });

      const response = await fetch(url);

      const json = await response.json();

      if (json.query.pages["-1"] !== undefined) {
        return null;
      }

      try {
        return pageQuerySchema.parse(json);
      } catch (error) {
        console.error("url", url);
        console.error("json", json);
        throw error;
      }
    },
    async searchPageByTitle(pageTitle: string) {
      const response = await fetch(
        makeUrl({
          action: "query",
          srwhat: "title",
          list: "search",
          srsearch: `PPlus/${pageTitle}`,
          srprops: "",
          srlimit: 25, // max of discord autocomplete
        })
      );

      const json = await response.json();

      const parsed = z
        .object({
          query: z.object({
            searchinfo: z.object({
              totalhits: z.int(),
            }),
            search: z.array(
              z.object({
                title: z.string(),
              })
            ),
          }),
        })
        .parse(json);

      return parsed.query.search.filter((s) => !s.title.endsWith("/Data"));
    },
    async wikitext(page: string) {
      const response = await fetch(
        `https://dragdown.wiki/wiki/${page}?action=raw`
      );

      return response.text();
    },
  };
};

let dragdown: ReturnType<typeof loginAndGetDragdown> | null = null;

export const loginAndGetDragdownCached = () => {
  if (dragdown === null) {
    dragdown = loginAndGetDragdown();
  }

  return dragdown;
};
