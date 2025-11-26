const tools = require('../js/tools.js');
const Discord = require('discord.js');
let config = tools.config;

module.exports = {
	name: 'register',
	aliases: ['connect', 'registerMT4'],
	description: 'Connect your **LIVE** MT4 account with our discord bot!',
	args: true,
	dmOnly: true,
	usage: '<MT4 Login>',
	cooldown: 5,
	allowedRoles:['@everyone'],	
	execute(message, args) {		
		try {				
			if(args.length != 1) {
				tools.AuthorReply(message, 'Please provide only one argument, just need your **LIVE** MT4 Login! \n for eg: !register 90812344');
				return;
			}
			const login = args[0];

			if(isNaN(login)) {
				tools.AuthorReply(message, 'That\'s not a valid login!');
				return;
			}

			RegisterUser(message.author.id, login);
			
			// Wait for response
			// message.author.send('Do you confirm these details (Y/N)?\n\n**Login** - ' + login);
			// const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 10000 });
			// collector.on('collect', response => {
			// 	if(config.Denies.includes(response.content.toLowerCase())) {
			// 		message.author.send('No problem, let\'s try again later!');
			// 		return;
			// 	} 
			// 	else if (config.Confirms.includes(response.content.toLowerCase())) {	
			// 		RegisterUser(message.author.id, login);
			// 	}
			// 	else {
			// 		message.author.send('Sorry, I didn\'t understand that');
			// 		return;
			// 	}
			// });
		} 
		catch (error) {
			tools.LogError(error);
			message.author.send('there was an error trying to execute that command!');
		}		


		function RegisterUser(discordUserId, login) {
			const payload = {
				DiscordUserId: discordUserId,
				Login: login,
			};

			const endpoint = 'verifyDiscordUser';
			tools.Log('Calling boox endpoint ' + endpoint + ' with payload ' + payload);

			tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
				if(data == null || data === undefined) return;

				console.log(JSON.stringify(data));

				if(!data.success && data.message != '') {
					tools.AuthorReply(message, data.message);
				}
				else if(data.success) {
					tools.AuthorReply(message, 'I\'ve sent an email to:\n' + data.message + '\n Please report back to me with the verification code with `!confirmRegister` command!');
				}
			}).catch(err => tools.LogError(err));
		}
	},
};