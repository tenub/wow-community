import WoWCommunityAPI from '../src';

const wow = new WoWCommunityAPI({ apiKey: process.env.BATTLE_API_KEY });

wow.achievement(127)
	.then((res) => {
		console.log(JSON.stringify(res, null, 2));
	})
	.catch((err) => {
		console.log(err);
	});
