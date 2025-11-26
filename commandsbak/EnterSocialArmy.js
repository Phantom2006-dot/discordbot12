const tools = require('../js/tools.js');
const Discord = require('discord.js');
let config = tools.config;

module.exports = {
	name: 'entersocialarmy',
	aliases: [],
	description: 'This is a special closed group of our biggest supporters and top contributors will be rewarded handsomely. It’s quite simple, we show you our latest social media posts and you get points for liking, sharing and commenting',	
	args: false,
	// usage: '<competition name>',
	dmOnly: false,
	cooldown: 5,
	// allowedRoles:['s-army', 'red role'], // no one
	async execute(message, args) {
		try{	
			if(message.channel.type !== 'dm') tools.AuthorReply(message, 'This command is DM only, I\'ve started the party there!');			

			tools.AttemptToAddUserToSocialArmy(message.author);					
		}
		catch (error) {
			tools.LogError(error);
			tools.AuthorSend(message, 'There was an error trying that command');
		}
	}
};
