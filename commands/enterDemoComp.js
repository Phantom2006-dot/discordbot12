const tools = require('../js/tools.js');

module.exports = {
	name: 'enterDemoCompetition',	
	description: 'This command will enter you into demo competitions. It will create an MT4 demo account for you to trade with. If no account currency is provided, USD is used.',
	args: true,
	usage: '<competition name> <(optional) account currency>',
	cooldown: 5,	
	allowedRoles:['@everyone'],
	execute(message, args) {
		try{
			// return tools.AuthorSend(message, 'Not live yet!');				
		
			if(args.length == 0 || args.length > 2) {
				return tools.AuthorSend(message, 'Please double check how to run this command. Use `!help enterDemoCompetition`');				
			}
			
			const competitionName = args[0].toLowerCase();		
			
			const payload = {
				DiscordUserId: message.author.id,
				DiscordUserName: message.author.username,
				CompetitionName: competitionName,
				demo: true,
			};

			if(args.length > 1)
				payload.baseCurrency = args[1].toUpperCase();
			const endpoint = 'EnterUserToCompetition';
			tools.Log('Calling boox endpoint ' + endpoint + ' with payload ' + payload);
			tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {

				if(data == null || data === undefined) return;

				if(!data.success && data.message != '') {
					tools.AuthorReply(message, data.message);
				}
				else if(data.success) {

					tools.DMUser(message.author, `All done, you've entered **${args[0]}**!\nHere are your **DEMO** MT4 credentials for this competition.
					\n**Login**: ${data.login}\n**Password**: \`${data.pass}\`\n**Investor Password**: \`${data.investorPass}\`
					\nGood luck!`)
					.then(() => {
						if (message.channel?.isDMBased()) return;
						tools.AuthorReply(message, 'All done! I\'ve DM\'d you your logins for this competition');
					})
					.catch(error => {
						tools.LogError(error);
						tools.AuthorReply(message,'it seems like I can\'t DM you! Do you have DMs disabled?');
					});	
				}
			}).catch(err => {
				tools.LogError(err);
			});			
		}
		catch (error) {
			tools.LogError(error);
			message.reply('There was an error trying that command');
		}
	},
};