const tools = require('../js/tools.js');
let config = tools.config;
module.exports = {
	name: 'verifyEveryone',
	aliases: [],
	description: '',
	args: false,
	usage: '',
	cooldown: 5,
	allowedRoles:[],
	execute(message, args) {
		try{
			if(message.author.id != config.AdminUser) return tools.AuthorReply(message, 'You do not have permission to call this command!');
			
			const client = message.client;
			const guild = client.guilds.cache.get('732102588031565914');	
			const members = guild?.members?.cache;
			
			members?.forEach(m => {
				console.log(m.user.username)
			});


			// Get our stats channels
			// const totalUsers = bot.channels.get('470358845751951361');
			// const onlineUsers = bot.channels.get('470366354222874665');
			// const codeMonkeys = bot.channels.get('470358906225295391');


			// var userCount = guild.memberCount;
			// var onlineCount = guild.members.filter(m => m.presence.status === 'online').size
			
		}
		catch (error) {
			tools.LogError(error);
			tools.AuthorReply(message, 'There was an error trying that command');
		}
	},
};



