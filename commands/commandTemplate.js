const tools = require('../js/tools.js');

module.exports = {
	name: 'this is a command template name no one will guess',
	aliases: [],
	description: '',
	args: true,
	usage: '<competition name>',
	cooldown: 5,
	allowedRoles:[], // no one
	execute(message, args) {
		try{

			if(args.length != 1) {
				return message.author.send('Please provide only 1 competition you\'ll like to join');				
			}
			
			const competitionName = args[0].toLowerCase();
			
		}
		catch (error) {
			tools.LogError(error);
			tools.AuthorReply(message, 'There was an error trying that command');
		}
	},
};