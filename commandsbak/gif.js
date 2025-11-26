const tools = require('../js/tools.js');

module.exports = {
	name: 'gif',
	aliases: [],
	description: '',
	args: true,
	usage: '<competition name>',
	cooldown: 5,
	allowedRoles: ['Global Prime Team' , 'red role'], 
	execute(message, args) {
		try{

			if(args.length != 1) {
				return message.author.send('Please provide only 1 gif');				
			}
			
			const gif = args[0].toLowerCase();
			let gifLink;
			switch(gif.toLowerCase()){
				case 'nice':
					gifLink = 'https://giphy.com/gifs/thumbs-up-111ebonMs90YLu'; 
					break;
				case 'bye':
					gifLink = 'https://giphy.com/gifs/the-simpsons-homer-simpson-disappear-q8C0Ljmy4F6Ss'; 					
					break;
				default:
					gifLink = gif;
					break;
			}			

			message.delete();
			message.channel.send(gifLink);
		}
		catch (error) {
			tools.LogError(error);
			tools.AuthorReply(message, 'There was an error trying that command');
		}
	},
};