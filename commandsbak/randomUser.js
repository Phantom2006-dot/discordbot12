const tools = require('../js/tools.js');
let config = tools.config;

module.exports = {
	name: 'randomUser',
	aliases: [],
	description: 'Select random user from a given competition.',
	args: true,	
	usage: '<competition name>',
	cooldown: 5,
	allowedRoles:['Global Prime Team'], 
	execute(message, args) {
		try{
			
			if(message.author.id != config.AdminUser) return tools.AuthorReply(message, 'You do not have permission to call this command!');

			if(args.length != 1){
				return tools.AuthorReply(message, 'Please provide one competition, `!randomUser <competitionName`');
			}

			const payload = {
				CompName: args[0].toLowerCase(),
			};

			const endpoint = 'GetRandomUserFromCompetition';

			tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
				if(data == null || data === undefined) return;

				console.log(JSON.stringify(data));

				if(!data.success && data.message != '') {
					tools.AuthorReply(message, data.message);
				}
				else if(data.success) {
					GetRandomUser(message, data.message);					
				}
			}).catch(err => tools.LogError(err));
			
		}
		catch (error) {
			tools.LogError(error);
			message.reply('There was an error trying that command');
		}
	},
};

async function GetRandomUser(message, userId){
	let randomUser;
	try{
		randomUser = await message.client.users.fetch(userId).catch(e => {throw e});		
	}
	catch 
	{
		randomUser = userId;		
	}
	
	tools.AuthorReply(message, `The lucky winner is ${randomUser}`)
	.then(m => { m.react('🥳')
	.then(() => m.react('🤑'))});
}