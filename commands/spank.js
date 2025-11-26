const tools = require('../js/tools.js');

module.exports = {
	name: 'spank',
	aliases: [],
	description: 'Give it a go...',
	allowedRoles:['@everyone'],
	execute(message, args) {
		try{

			let spankResponses = [
				"Don't push me, push a push-pop", 
				"Oh, behave!",				
				"Don't touch me, bro",
				"Yeah, baby yeah!",
				"Oi, go spank a b-book broker!",
				"You know I like that, right?",
				"I am a man-bot. Do you usually like to spank men?",
				"You spank like a girl...",
				"That's going straight to the spankbank",
				"I think a fly just landed on me, That's the hardest you've got?",			
				"You're lucky I'm stuck in this electronic box",
				"I thought we were on the same team?"
			];

			let response = Math.floor(Math.random() * spankResponses.length);

			tools.AuthorReply(message, spankResponses[response]);
		}
		catch (error) {
			tools.LogError(error);
			message.reply('There was an error trying that command');
		}
	},
};