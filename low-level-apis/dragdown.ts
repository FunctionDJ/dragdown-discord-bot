import z from "zod";
import { fetchJSON } from "../util/fetch-json";
import type { CargoParams } from "./cargo-params";

const cargoquery = (
	cookie: string,
	{ tables, fields, where, limit }: CargoParams
) =>
	fetchJSON(
		"https://dragdown.wiki/w/api.php",
		{
			action: "cargoquery",
			tables: tables.join(","),
			fields: fields.join(","),
			where,
			limit,
		},
		cookie
	);

const endpoint = "https://dragdown.wiki/w/api.php";

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
const loginAndGetCargoQuery = async () => {
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

	return (params: CargoParams) =>
		cargoquery(loginResponse.headers.get("set-cookie")!, params);
};

let authedCargoquery: ReturnType<typeof loginAndGetCargoQuery> | null = null;

/**
 * @deprecated see
 * {@link loginAndGetCargoQuery}
 */
export const loginAndGetCargoqueryCached = () => {
	if (authedCargoquery === null) {
		authedCargoquery = loginAndGetCargoQuery();
	}

	return authedCargoquery;
};
