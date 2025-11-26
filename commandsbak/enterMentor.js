const tools = require('../js/tools.js');
let config = tools.config;

module.exports = {
	name: 'enterMentor',
	aliases: [],
	description: '',
	args: true,
	dmOnly: true,
	usage: '<mentor name> (Greg, Alex, GhostRider)',
	cooldown: 5,
	allowedRoles:['@everyone'], // no one
	execute(message, args) {
		try{

			if(args.length != 1) {
				return message.author.send('Please provide only 1 mentor you\'ll like to join');				
			}
			let client = message.client;	

			const mentorName = args[0].toLowerCase();

			const guild = client.guilds.cache.get('732102588031565914');		
			// const guild = client.guilds.cache.get(config.mentorGuild);	

			guild.members.fetch(message.author.id)
			.then(member => {
				switch(mentorName){
					case 'greg':
						// check if user already has role
						const alreadyHasRole = member.roles.cache.some(r=>[config.GregsChannelRoleId, config.RedRoleId].includes(r.id));						
						if(alreadyHasRole) return tools.DMUser(member, "You are already in Greg's channel");

						let sendTandC = true;					

						message.channel.messages.fetch({ limit: 50 })
						.then(messages => {
							console.log(1);
							for(const m of messages){
								if(!m[1].author.bot) continue;
								
								let e = m[1].embeds[0];
								if(e.footer && e.footer.text === 'Accepted' && e.description.toLowerCase().includes('gregs channel')){																		
									console.log(2);
									const member = guild.members.cache.get(message.author.id);	
																		
									tools.CheckUserIsMT4Verified(message.author.id)
									.then(userVerified => {	
										console.log(3);
										if(userVerified){
											// member.roles.add(config.RedRoleId)
											member.roles.add(config.GregsChannelRoleId)
											.then(() => {		
												const acceptedMessage = 'accepted Gregs T&C\'S, and verified MT4, mentor role added';
												
						 						guild.members.fetch(config.AdminUser)
												.then(member => {
													tools.DMUser(member, message.author.username + ' ' + acceptedMessage);
												});
												sendTandC = false;
												console.log(4);
												console.log("setting sendTandC to " + sendTandC);
												return tools.DMUser(member, 'You\'ve been added to Gregs Mentor Channel, welcome!');
												
											})
											.catch(e => {
												tools.LogError(e);
											});
										}
									});
								}	
							}
							
							console.log(5);
							console.log("sendTandC: " + sendTandC);
							if(sendTandC){
								console.log(6);
								var fortnightAway = new Date(Date.now() + 12096e5);
								let verificationMessage = 'Hi.\nYou have a 2 week free trial to Gregs channel, which will expire on ' + fortnightAway.toDateString() + ', After which Global Prime will charge a monthly fee of US$50 for access to the Channel. \n\nBy typing `!accept`, you hereby accept the Terms And Conditions above, as well as authorise Global Prime to deduct this fee from your MT4 account on the 14th day of each month.\nYour access to the Channel can be terminated at any time by providing notice to support@globalprime.com. Any unused access fee for the month in which notice to terminate has been given will be calculated and refunded to your MT4 account on a pro rate basis'
							
								PostTandC(message.author)
								.then(() => tools.DMUser(message.author, verificationMessage));
							}
						})
						
					// case		
					break;
				}
			});



			// const member = await guild.members.fetch(message.author.id);
			// const member = guild.members.cache.get(message.author.id);
			// console.log(member);
			// member.then(m => console.log(m));

			// .then(m => console.log(m));
			
			// switch(mentorName){
			// 	case 'greg':
			// 		// check if user already has role
			// 		const alreadyHasRole = member.roles.cache.some(r=>[config.GregsChannelRoleId, "737197256922628157"].includes(r.id));
					
			// 		if(alreadyHasRole) return tools.DMUser(user, "You are already in Greg's channel");
			// 		var fortnightAway = new Date(Date.now() + 12096e5);
					
			// 		let verificationMessage = 'Hi.\nYou have a 2 week free trial to Gregs channel, which will expire on ' + fortnightAway.toDateString() + ', After which Global Prime will charge a monthly fee of US$50 for access to the Channel. \n\nBy typing `!accept`, you hereby accept the Terms And Conditions above, as well as authorise Global Prime to deduct this fee from your MT4 account on the 14th day of each month.\nYour access to the Channel can be terminated at any time by providing notice to support@globalprime.com. Any unused access fee for the month in which notice to terminate has been given will be calculated and refunded to your MT4 account on a pro rate basis'

			// 		PostTandC(user)
			// 		.then(() => tools.DMUser(user, verificationMessage));
			// 		break;
			// }
		}
		catch (error) {
			tools.LogError(error);
			tools.AuthorReply(message, 'There was an error trying that command');
		}
	},
};

async function PostTandC(user){
	return tools.DMUser(user, config.MentorTandCPart1)
	.then(() => tools.DMUser(user, config.MentorTandCPart2))
	.then(() => tools.DMUser(user, config.MentorTandCPart3))
	.then(() => tools.DMUser(user, config.MentorTandCPart4))
	.then(() => tools.DMUser(user, config.MentorTandCPart5))
	.then(() => tools.DMUser(user, config.MentorTandCPart6))
	.then(() => tools.DMUser(user, config.MentorTandCPart7))
	.then(() => tools.DMUser(user, config.MentorTandCPart8));
}