const endpoint = "https://dragdown.wiki/w/api.php";

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
      const url = new URL(endpoint);
      url.searchParams.set("action", "cargoquery");
      url.searchParams.set("format", "json");
      url.searchParams.set("tables", tables.join(","));
      url.searchParams.set("fields", fields.join(","));

      if (where !== undefined) {
        url.searchParams.set("where", where);
      }

      if (limit !== undefined) {
        url.searchParams.set("limit", String(limit));
      }

      const response = await fetch(url, {
        headers: {
          cookie: loginResponse.headers.get("set-cookie")!,
        },
      });

      const json = await response.json();
      return json.cargoquery;
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
