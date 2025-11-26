const tools = require('../js/tools.js');
const { GuildAuditLogsEntry } = require('discord.js');

module.exports = {
	name: 'manualRegister',
	aliases: ['manualConnect'],
	description: 'If you don\'t have a live account, register your Discord with your name and email.',
	args: true,
	dmOnly: true,
	usage: '<first name> <last name> <email>',
	cooldown: 5,
	allowedRoles:[],	
	execute(message, args) {		
		try {				
			return false;
			if(args.length != 3) {
				tools.AuthorSend(message, 'Please provide 3 arguments, in this format <first name> <last name> <email>\n for eg: !manualRegister John Smith jsmith@hotmail.com');
				return;
			}

			message.react('👍').then(() => message.react('👎'));

			const filter = (reaction, user) => {
				return ['👍', '👎'].includes(reaction.emoji.name) && user.id === message.author.id;
			};

			tools.AuthorSend(message, 'Do you confirm these details? Please make sure they are in this format (without \'<>\')' + 
			'\n!manualRegister <first name> <last name> <email>' + 
			'\nReact thumbs up to confirm, or thumbs down if you want to try again');
			
			message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
				.then(collected => {
					const reaction = collected.first();
					
					if (reaction.emoji.name === '👍') {
						const firstName = args[0];
						const lastName = args[1];
						const email = args[2];
						RegisterUser(message.author.id, firstName, lastName, email);
					} 
					else {
						tools.AuthorSend(message, 'No problem, lets try again!');
					}
				})
				.catch(() => {
					tools.AuthorSend(message, 'Please only react with a thumbs up or thumbs down');
				});
		} 
		catch (error) {
			tools.LogError(error);
			tools.AuthorSend(message, 'there was an error trying to execute that command!');
		}		


		function RegisterUser(discordUserId, firstName, lastName, email) {
			const payload = {
				DiscordUserId: discordUserId,
				firstName: firstName,
				lastName: lastName,
				email: email,
			};

			const endpoint = 'verifyDiscordUser';

			tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
				if(data == null || data === undefined) return;

				console.log(JSON.stringify(data));

				if(!data.success && data.message != '') {
					tools.AuthorSend(message, data.message);
				}
				else if(data.success) {
					tools.AuthorSend(message, 'I\'ve sent an email to:\n' + data.message + '\n Please report back to me with the verification code with \'!confirmRegistration\' command!');
				}
			}).catch(err => console.log(err));
		}
	},
};