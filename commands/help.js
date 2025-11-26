const { prefix } = require('../config.json');
const tools = require('../js/tools.js');
let config = tools.config;

module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command',
	aliases: ['commands'],
	usage: '[command name]',
	cooldown: 1,
	allowedRoles:['Global Prime Team', 'Moderator', 'Ambassadors', 'The Lady Traders', '@everyone', 'blue role'],
	execute(message, args) {
		try {
			let helpMessage;
			const { commands } = message.client;

			const guild = message.client.guilds.cache.get(config.GPGuild); // A$AS OR GLOBAL PRIME
			// const guild = message.client.guilds.cache.get(config.A$ASGuild); // A$AS OR GLOBAL PRIME
			
			if (!guild) return tools.AuthorReply(message, 'The bot isn\'t in the guild with this ID.');

			const member = guild?.members.cache.get(message.author.id);

			if (!args.length) {
				helpMessage = 'Here\'s a list of my commands:\n';
				const commandsByRole = commands.filter(c => c.allowedRoles !== undefined && member.roles.cache.some(role => c.allowedRoles.includes(role.name)));

				helpMessage += commandsByRole.map(command => '**' + command.name + '** - ' + command.description).join(', \n');
				helpMessage += `\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`;

				return tools.DMUser(message.author, helpMessage)
					.then(() => {
						if (message.channel.type === 'dm') return;
						tools.AuthorReply(message, 'I\'ve sent you a DM with all my commands specific to your role!');
					})
					.catch(error => {
						tools.LogError(error);
						console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
						tools.AuthorReply(message,'it seems like I can\'t DM you! Do you have DMs disabled?');
					});						
			}

			const name = args[0].toLowerCase();
			const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

			if (!command) {
				return tools.AuthorReply(message, 'that\'s not a valid command!');
			}

			if(command.allowedRoles === undefined || !member?.roles.cache.some(role => command.allowedRoles.includes(role.name))) {		
				return tools.AuthorReply(message, 'Your role can\'t do that!');
			}

			helpMessage = `**Name:** ${command.name}\n`;

			if (command.aliases) helpMessage += `**Aliases:** ${command.aliases.join(', ')}\n`;
			if (command.description) helpMessage += `**Description:** ${command.description}\n`;
			if (command.usage) helpMessage +=`**Usage:** ${prefix}${command.name} ${command.usage}\n`;

			helpMessage += `**Cooldown:** ${command.cooldown || 3} second(s)`;

			tools.ChannelSend(message, helpMessage);
		}
		catch (err) {
			tools.LogError(err);
		}
	}
};