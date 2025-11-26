const tools = require('../js/tools.js');

module.exports = {
	name: 'approveTestimony',
	aliases: [],
	description: 'This command will approve a new testimony added to put to web frontend. Only Ambassador can approve it.',
	args: true,
	usage: '<testimonyId> <approve (0/1)>',
	cooldown: 5,
	allowedRoles:['Ambassadors'], // no one
	execute(message, args) {
		try{

			if(message.channel.type !== 'dm') {
        tools.AuthorReply(message, 'This command is DM only, I\'ve started the party there!');
      }

			if(message.content.length == 0) {
				return tools.AuthorSend(message, 'Please double check how to run this command. Use `!help approveTestimony`');				
			}
			
			const testimonyId = args[0];
      const approval = args[1];

      const payload = {
				TestimonyId: testimonyId,
				Approved: approval,
			};

      const endpoint = 'UpdateTestimonyApprove';

      tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
				if(data == null || data === undefined) return;

				if(!data.success && data.message != '') {
					tools.AuthorReply(message, data.message);
				}
				else if(data.success) {
					tools.DMUser(message.author, 'Updated approval to:' + approval);
				}
			}).catch(err => {
				tools.LogError(error);
			});
			
		}
		catch (error) {
			tools.LogError(error);
			tools.AuthorSend(message, 'There was an error trying that command');
		}
	},
};