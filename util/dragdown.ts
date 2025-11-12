import type { CargoParams } from "./apis/cargo-params";
import z from "zod";
import { cargoquery } from "./apis/cargoquery";

const endpoint = "https://dragdown.wiki/w/api.php";

const loginAndGetDragdown = async () => {
	const loginTokenResponse = await fetch(
		`${endpoint}?action=query&format=json&meta=tokens&type=login`
	);

	const json: unknown = await loginTokenResponse.json();

	const loginTokenResponseSchema = z.object({
		query: z.object({
			tokens: z.object({
				logintoken: z.string(),
			}),
		}),
	});

	const parsed = loginTokenResponseSchema.parse(json);

	const loginResponse = await fetch(endpoint, {
		body: new URLSearchParams([
			["action", "login"],
			["lgname", process.env.DRAGDOWN_BOT_USERNAME!],
			["lgpassword", process.env.DRAGDOWN_BOT_PASSWORD!],
			["lgtoken", parsed.query.tokens.logintoken],
		]),
		headers: {
			cookie: loginTokenResponse.headers.get("set-cookie")!,
		},
		method: "POST",
	});

	return {
		/**
		 * @deprecated
		 * my previous method of querying cargo.
		 *
		 * probably allows CREATE, UPDATE, DELETE unlike cargoExport because cargoquery requires the above authentication.
		 *
		 * this might not be needed for the bot at all and has some downsides compared to cargoExport
		 *
		 * like wrapping result objects in another object with a "title" key and apparently stringifying values like numbers.
		 */
		cargoquery(params: CargoParams) {
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
