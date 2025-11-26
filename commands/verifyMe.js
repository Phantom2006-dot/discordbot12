const tools = require('../js/tools.js');
const config = tools.config;
const axios = require('axios');

module.exports = {
	name: 'verifyMe',
	aliases: [],
	description: 'This command will prompt user to input their email address for verification.',
	args: false,
	usage: '',
	cooldown: 5,
	allowedRoles:['@everyone'],
	async execute(message) {
		try {
			const url = config.VerificationEndpoint;
			if(!message.channel.isDMBased()) tools.AuthorReply(message, 'This command is DM only, I\'ve started the party there!');	

			// tools.DMUser(message.author, 'Excuse me, during my heavy loads this process could take minutes.');

			const res = await axios.get(`${url}/discord-users?filters[discord_id][$eq]=${message.author.id}`);

			if (res.data.data[0]) {
				tools.DMUser(message.author, 'Congrats, you are now verified, all channels unlocked!');
			} else {
				tools.DMUser(message.author, 'To unlock all channels on Afterprime Discord please provide your valid email address in this private chat only. Do not post it to the Discord channel. To do this simply enter this command with your email\n**!verifyemail** _<useremail>_');
			}
			
		} catch(err) {
			tools.LogError(err);
			tools.DMUser(message.author, 'There was an error trying to check your membership.');
		}
	},
};



