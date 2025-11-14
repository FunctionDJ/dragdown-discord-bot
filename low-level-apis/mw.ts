import { Mwbot } from "mwbot-ts";

export const mw = await Mwbot.init({
	apiUrl: "https://dragdown.wiki/w/api.php",
	credentials: {
		anonymous: true,
	},
});
