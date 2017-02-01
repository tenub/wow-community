import WoWCommunityAPI from '../src';

const wow = new WoWCommunityAPI({ apiKey: process.env.BATTLE_API_KEY });

wow.challenge('burning-legion')
	.then((res) => {
		console.log(JSON.stringify(res, null, 2));
	})
	.catch((err) => {
		console.log(err);
	});
