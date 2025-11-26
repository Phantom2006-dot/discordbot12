const tools = require('../js/tools.js');

module.exports = {
	name: 'enterLiveCompetitions',	
	description: 'This command will enter you into all live competitions that are running.',
	args: true,
	usage: '<LIVE MT4 Account Number>',
	cooldown: 5,	
	allowedRoles:['@everyone'],
	execute(message, args) {
		try{
			// return tools.AuthorSend(message, 'Not live yet!');				
		
			if(args.length != 1) {
				return tools.AuthorSend(message, 'Please double check how to run this command. Use `!help enterLiveCompetition`');				
			}
				
			const MT4AccountNumber = args[0].toLowerCase();		
			
			const payload = {
				DiscordUserId: message.author.id,
				DiscordUserName: message.author.username,
				MT4AccountNumber: MT4AccountNumber,
				demo: false,
			};

			const endpoint = 'EnterUserToCompetition';

			tools.BooxPostCall(endpoint.toLowerCase(), payload)
			.then(data => {
				if(data == null || data === undefined) return;
				tools.AuthorReply(message, data.message);				
			}).catch(err => {
				tools.LogError(error);
			});			
		}
		catch (error) {
			tools.LogError(error);
			message.reply('There was an error trying that command');
		}
	},
};