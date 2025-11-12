import { CargoParams } from "./apis/CargoParams";
import { cargoquery } from "./apis/cargoquery";

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
    async cargoquery(params: CargoParams) {
      return cargoquery(loginResponse.headers.get("set-cookie")!, params);
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
