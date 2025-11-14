import { Mwbot } from "mwbot-ts";

const mw = await Mwbot.init({
	apiUrl: "https://dragdown.wiki/w/api.php",
	credentials: {
		anonymous: true,
	},
	suppressWarnings: true,
});

console.log(
	await mw.parse(
		{
			page: "Special:CargoExport",
		},
		{
			params: {
				tables: "Glossary_PPlus",
				fields: "term",
				limit: 10,
			},
		}
	)
);
