const tools = require('../js/tools.js');

module.exports = {
	name: 'UpdateCompetitionReadOnly',
	aliases: [],
	description: 'Enable/disable trading for given competition',
	args: true,
	dmOnly: true,
	usage: '<competition name> <readOnly (0/1)>',
	cooldown: 5,
	allowedRoles:["Global Prime Team", "red role"], 
	execute(message, args) {
		try {
			// if(message.author.id != '329489566664884224'){
			// 	return tools.AuthorReply(message, 'Only Asaf can call this command! cheeky');
			// }

			const competitionName = args[0].toLowerCase();			
			const readOnly = args[1];

			const payload = {
				CompetitionName: competitionName,
				readOnly: readOnly,
			};

			const endpoint = 'UpdateCompetitionReadOnly';
			tools.Log('Calling boox endpoint ' + endpoint + ' with payload ' + payload);

			tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
				if(data == null || data === undefined) return;

				if(!data.success && data.message != '') {
					tools.AuthorReply(message, data.message);
				}
				else if(data.success) {
					tools.DMUser(message.author, 'Updated ReadOnly to:' + readOnly);
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