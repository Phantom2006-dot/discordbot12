const tools = require('../js/tools.js');

module.exports = {
	name: 'enterCompetition',
	aliases: [],
	description: 'Enter a competition',
	args: true,
	usage: '<competition name> <account currency>',
	cooldown: 5,
	//dmOnly: true,
	allowedRoles:[],	
	execute(message, args) {
		try{

			if(args.length != 2) {
				return tools.AuthorReply(message, 'Please provide arguements in this format `!enterCompetition <competition name> <account currency>`');				
			}
			
			const competitionName = args[0]?.toLowerCase();
			const accountCurrency = args[1]?.toUpperCase();
			
			const payload = {
				DiscordUserId: message.author.id,
				CompetitionName: competitionName,
				baseCurrency: accountCurrency,
			};

			const endpoint = 'EnterUserToCompetition';
			tools.Log('Calling boox endpoint ' + endpoint + ' with payload ' + payload);

			tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
				if(data == null || data === undefined) return;

				console.log(JSON.stringify(data));

				if(!data.success && data.message != '') {
					tools.AuthorReply(message, data.message);
					// message.author.send(data.message);
				}
				else if(data.success) {
					// message.author.send('https://giphy.com/gifs/thumbs-up-111ebonMs90YLu');
					tools.AuthorReply(message, `All done, you've entered **${args[0]}**!\nHere are your **DEMO** MT4 credentials for this competition.
					\n**Login**: ${data.login}\n**Password**: ${data.pass}
					\nGood luck!`);
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
}