const tools = require('../js/tools.js');
const { client } = require('../js/globalprimediscordbot.js');

module.exports = {
	name: 'addTestimony',
	aliases: [],
	description: 'This command will post a new testimony into web frontend. Once Ambassador approve it, they will show it shortly.',
	args: false,
	usage: '<testimony>',
	cooldown: 5,
  dmOnly: true,
	allowedRoles:['@everyone'],
	execute(message, args) {
		try{

      if(message.channel.type !== 'dm') {
        tools.AuthorReply(message, 'This command is DM only, I\'ve started the party there!');
      }

			if(message.content.length == 0) {
				return tools.AuthorSend(message, 'Please double check how to run this command. Use `!help addTestimony`');				
			}
			
      const payload = {
        DiscordUserId: message.author.id,
        DiscordUserName: message.author.username,
				PostTestimony: message.content,
        Approved: false,
			};

      const endpoint = 'AddNewTestimony';
      tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
        if(data == null || data === undefined) return;

        if(!data.success && data.message != '') {	
					tools.DMUser(message.author, data.message)			
				}

        else if(data.success) {
					tools.DMUser(message.author, `All done, we will check your testimony to put on our website shortly.\nThanks!`);	
				}
      }).catch(err => {
				tools.LogError(err);
			});
			
		}
		catch (error) {
			tools.LogError(error);
      message.reply('There was an error trying that command');
		}
	},
};