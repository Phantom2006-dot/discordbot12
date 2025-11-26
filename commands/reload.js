const tools = require("../js/tools");

module.exports = {
	name: 'reload',
	description: 'Reloads a command',
	allowedRoles:[],
	execute(message, args) {
		try {
			const commandName = args[0]?.toLowerCase();
			const command = message.client.commands.get(commandName)
				|| message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

			if (!command) return message.channel.send(`There is no command with name or alias \`${commandName}\`, ${message.author}!`);

			delete require.cache[require.resolve(`./${command.name}.js`)];

			const newCommand = require(`./${command.name}.js`);
			message.client.commands.set(newCommand.name, newCommand);
			message.channel.send(`Command \`${command.name}\` was reloaded!`);
		} 
		catch (error) {
			tools.LogError(error);
			message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
		}
	},
};