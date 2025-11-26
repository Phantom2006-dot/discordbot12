const tools = require('../js/tools.js');
let config = tools.config;

module.exports = {
	name: 'newpost',
	aliases: [],
	description: 'link must contain http or https',
	args: true,
	usage: '<description> <link>',
	cooldown: 5,
	allowedRoles:['Global Prime Team', 'red role'], // no one
	execute(message, args) {
		try{

			// const desc = args[0].toLowerCase() == '""' ? '' : args[0].toLowerCase();
			const desc = message.content.slice(1).split('"')[1].trim();
			const link = message.content.slice(1).split('"')[2].trim();

			const payload = {
				Link: link
			};

			const endpoint = 'NewSocialPostController';
			tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
				if(data == null) return;	
				if(!data.success && data.message != '') {
					// tools.AuthorReply(message, data.message);	
					tools.DMUser(message.author, data.message)			
				}
				else if(data.success) {
					tools.DMUser(message.author, data.message);
					const template = '<@&' + config.sArmyRoleId + '>\n'+ 					
					'🔥 New Post Alert 🔥\n\n' + desc + '\n\n' + link + '\n\nSocial Army registered users only. Please click the emoji\'s when you have done the following:\n\n' +
					'1️⃣ = \'Liked\' this post (10 points)\n' +
					'2️⃣ = Commented this post (15 points)\n' +
					'3️⃣ = Shared this post (20 points)';
		
					message.delete();
					message.channel.send(template)
					.then(m => m.react('1️⃣')
					.then(() => m.react('2️⃣')
					.then(() => m.react('3️⃣'))));	
				}
						
			}).catch(err => tools.Log(err));		
		}
		catch (error) {
			tools.LogError(error);
			tools.AuthorReply(message, 'There was an error trying that command');
		}
	},
};