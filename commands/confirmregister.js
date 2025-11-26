const tools = require('../js/tools.js');
let config = tools.config;

module.exports = {
	name: 'confirmRegister',
	aliases: ['confirmRegistration'],
	description: 'Confirm your verification code with our discord bot!',
	args: true,
	dmOnly: true,
	usage: '<MT4 Login> <verification code>',
	cooldown: 5,
	allowedRoles:['@everyone'],	
	execute(message, args) {		
		try {			

			if(args.length != 2) {
				return tools.AuthorReply(message, 'Please provide two arguments, simply copy and paste the command from the verification email I sent you');				
			}

			const loginOrEmail = args[0];
			const verificationCode = args[1];

			const payload = {
				DiscordUserId: message.author.id,
				Verification: verificationCode,
			};

			if(isNaN(loginOrEmail) && loginOrEmail.includes('@')) {
				payload.Email = loginOrEmail;
			}
			else {
				payload.Login = loginOrEmail;
			}

			const endpoint = 'confirmDiscordVerification';
			tools.Log('Calling boox endpoint ' + endpoint + ' with payload ' + payload);

			tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
				if(data == null || data === undefined) return;

				if(!data.success && data.message != '') {
					tools.AuthorReply(message, data.message);
				}
				else if(data.success) {
					// message.author.send('https://giphy.com/gifs/thumbs-up-111ebonMs90YLu');
					tools.AuthorReply(message, 'All done! You connected your GlobalPrime MT4 with Discord.');
					let gregAccepted = false;
					let ivanAccepted = false;
					var fortnightAway = new Date(Date.now() + 12096e5);
					
					message.channel.messages.fetch({ limit: 50 }).then(messages => {
						messages.forEach(m => {			
							m.embeds.forEach(e => {
								if(!gregAccepted && e.footer && e.footer.text === 'Accepted' && e.description.toLowerCase().includes('gregs channel')){
									gregAccepted = true;
									let client = message.client;	
									// const guild = client.guilds.cache.get('732102588031565914');		
									const guild = client.guilds.cache.get(config.mentorGuild);	
									const member = guild?.members?.cache.get(message.author.id);	

									// member.roles.add('737197256922628157')
									member?.roles.add(config.GregsChannelRoleId)
									.then(() => {										
										tools.DMUser(client.users.cache.get(config.AdminUser), message.author.username + ' accepted Gregs T&C\'s and verified mt4, mentor role added');
										tools.DMUser(client.users.cache.get(config.JemUser), message.author.username + ' accepted Gregs T&C\'s and verified mt4, mentor role added');
										tools.DMUser(client.users.cache.get(config.GregRubinUser), message.author.username + ' accepted Gregs T&C\'s and verified mt4, mentor role added');
										tools.DMUser(client.users.cache.get(member.id), 'You\'ve been added to Gregs mentor room!');
																
										const welcomeMessage = config.welcomeMessages[Math.floor(Math.random() * config.welcomeMessages.length)].replace('DiscordUser123', message.author.username);										
										const generalChannel = client.channels.cache.find(channel => channel.id == config.GregGeneralChannel);
										tools.DMChannel(generalChannel, welcomeMessage);
									})
									.catch(e => {
										tools.LogError(e);
									});
								}
								if(!ivanAccepted && e.footer && e.footer.text === 'Accepted' && e.description.toLowerCase().includes('ivan')){
									ivanAccepted = true;
									let client = message.client;	
									// const guild = client.guilds.cache.get('732102588031565914');		
									const guild = client.guilds.cache.get(config.mentorGuild);	
									const member = guild?.members.cache.get(message.author.id);	

									let messageToScrape = e.description.toLowerCase();
									const startIndex = messageToScrape.indexOf("you reacted to:") + "you reacted to:".length;
									let subscriptionEmoji = messageToScrape.substring(startIndex + 1, startIndex + 3);				
									
									if(!config.IvanMentorRoleEmojis.includes(subscriptionEmoji)){
										tools.DMUser(client.users.cache.get(config.AdminUser), message.author.username + ' got "' + subscriptionEmoji + '" as subscriptionEmoji?');						
										tools.DMUser(user, 'There has been an error, devs have been notified and working on it!');									
									}
					
									let subscriptionService = "";
									let assignRole = false;
									switch(subscriptionEmoji){
										case '🐶':
											assignRole = true;
											subscriptionService = "1 month: USD 50 (standard fee)";
											break;
										case '🐱':
											assignRole = true;
											subscriptionService = "3 months: USD 100 (1 month free)";
											break;
										case '🐭':
											assignRole = true;
											subscriptionService = "6 months: USD 200 (2 month free)";
											break;
										case '🐹':
											assignRole = true;
											subscriptionService = "1 year: USD 300 (6 month free)";
											break;
										case '🐰':
											subscriptionService = "1 month: USD 35 (standard fee)";
											break;
										case '🦊':
											subscriptionService = "3 months: USD 70 (1 month free)";
											break;
										case '🐻':
											subscriptionService = "6 months: USD 140 (2 month free)";
											break;
										case '🐼':
											subscriptionService = "1 year: USD 245 (5 month free)";
											break;
									}							
									
									if(assignRole){
										member?.roles.add(config.IvanChannelRoleId)
										// member.roles.add(config.RedRoleId)
										.then(() => {		
											let returnVerificationMessage = message.author.username + ' accepted Ivans T&C\'s and verified mt4.\n' + 
											'Chosen subscription service: ' + subscriptionEmoji + ' - ' + subscriptionService + 
												'\nMentor role added, free trial expires ' + fortnightAway.toDateString();
					
											tools.DMUser(client.users.cache.get(config.IvanUser), returnVerificationMessage);							 
											tools.DMUser(client.users.cache.get(config.AdminUser), returnVerificationMessage);
											tools.DMUser(client.users.cache.get(config.JemUser), returnVerificationMessage);
					
											tools.DMUser(client.users.cache.get(member.id), 'You\'ve been added to Ivans mentor room!');

											const welcomeMessage = config.welcomeMessages[Math.floor(Math.random() * config.welcomeMessages.length)].replace('DiscordUser123', message.author.username);										
											const generalChannel = client.channels.cache.find(channel => channel.id == config.IvanGeneralChannel);
											tools.DMChannel(generalChannel, welcomeMessage);
										})
										.catch(e => {
											console.log(e);
											tools.LogError(e);
										});
									}
									else
									{
										const returnMessage = message.author.username + ' accepted Ivans T&C\'s and verified mt4.\n' + 
										'Chosen subscription service: ' + subscriptionEmoji + ' - ' + subscriptionService + 
											'\nMentor role not added, message sent to user asking for chosen room.\nFree trial expires ' + fortnightAway.toDateString();

										tools.DMUser(client.users.cache.get(config.IvanUser), returnMessage);							 
										tools.DMUser(client.users.cache.get(config.AdminUser), returnMessage);
										tools.DMUser(client.users.cache.get(config.JemUser), returnMessage);
				
										tools.DMUser(client.users.cache.get(member.id), 'You\'ve been successfully registered! Please DM Ivan with the room you would like access to');
									}
								}
							});
						})
					});
				}
			}).catch((err) => {
				console.log(err);
				tools.LogError(err);
		});
		} 
		catch (error) {
			console.error(error);
			tools.AuthorSend(message, 'there was an error trying to execute that command!');			
		}	
	},
};