const tools = require('../js/tools.js');
let config = tools.config;

module.exports = {
	name: 'accept',
	aliases: [],
	description: 'Command used to accept mentor T&C\'s',
	args: false,	
	dmOnly: true,
	cooldown: 5,
	allowedRoles:[], // no one
	execute(message, args) {
		try {
			const channel = message.channel;
			const client = message.client;
			const guild = message.client.guilds.cache.get(config.mentorGuild);		
			// const guild = client.guilds.cache.get('732102588031565914');	
			
			guild.members.fetch(message.author.id)
			.then(member => {
				
				if(member == null) return tools.AuthorReply(message, "Looks like you are not a part of the mentor server. Please join the mentor server then try again.")

				channel.messages.fetch({limit: 10})
				.then(messages => {						
					for(const m of messages){						
						const messageToCheck = m[1].embeds;
						if(typeof messageToCheck == "undefined" || messageToCheck == "") continue;

						const embed =messageToCheck[0];
						let messageContent = embed.description;

						if(messageContent.toLowerCase().includes('gregs channel')) {

							if(embed.footer && embed.footer.text === 'Accepted') return tools.DMUser(member, 'You already accepted!');

							embed.setFooter('Accepted');
							m[1].edit(embed);

							const alreadyHasRole = member.roles.cache.some(r=>[config.GregsChannelRoleId, config.RedRoleId].includes(r.id));

							tools.CheckUserIsMT4Verified(message.author.id)
							.then(userVerified => {							
								if(userVerified){
									// member.roles.add(config.RedRoleId)
									member.roles.add(config.GregsChannelRoleId)
									.then(() => {					
										const acceptedMessage = 'accepted Gregs T&C\'S, and verified MT4, mentor role added';

										tools.DMUser(member, 'You\'ve been added to Gregs Mentor Channel, welcome!');
										guild.members.fetch(config.AdminUser)
										.then(member => {
											tools.DMUser(member, message.author + ' ' + acceptedMessage);
										});

										// tools.DMUser(client.users.cache.get(config.AdminUser), user.username + ' accepted Gregs T&C\'s and verified mt4, mentor role added');
										// tools.DMUser(client.users.cache.get(config.JemUser), user.username + ' accepted Gregs T&C\'s, mentor role added');
										// tools.DMUser(client.users.cache.get(config.GregRubinUser), user.username + ' accepted Gregs T&C\'s, mentor role added');

										// const welcomeMessage = config.welcomeMessages[Math.floor(Math.random() * config.welcomeMessages.length)].replace('DiscordUser123', member);
										// const generalChannel = client.channels.cache.find(channel => channel.id == config.GregGeneralChannel);
										// tools.DMChannel(generalChannel, welcomeMessage);
									})
									.catch(e => {
										tools.LogError(e);
									});
								}
								else 
								{
									console.log("not verified");
									console.log("member roles:" + member.roles.cache);
									
									if(alreadyHasRole){
										// tools.DMUser(client.users.cache.get(config.AdminUser), user.username + ' accepted Gregs T&C\'s but didn\'t verify yet. Already existing member');										
										// tools.DMUser(client.users.cache.get(config.GregRubinUser), user.username + ' accepted Gregs T&C\'s but didn\'t verify yet. Already existing member');
					
										const acceptedMessage = 'accepted Gregs T&C\'s but didn\'t verify yet. Already existing member';
										guild.members.fetch(config.AdminUser)
										.then(member => {
											tools.DMUser(member, message.author + ' ' + acceptedMessage);
										});	

										tools.DMUser(member, 'Thank you for accepting the terms and conditions.\n\n'+
										'You must first register your Discord with your MT4 Live Account with `!register` command, to continue using Gregs channel.\n\n'+	
										'You can use it like so:\n'+
										'`!register <mt4 login>` \n ie:\n'+
										'`!register 961234`\n\n' + 
										'Once registered, you will need to click on the tick again in <#752777582772224072>');						
									}
									else 
									{
										var fortnightAway = new Date(Date.now() + 12096e5);
										const acceptedMessage = 'accepted Gregs T&C\'s but didn\'t verify yet. mentor role not added. Free trial expires ' + fortnightAway.toDateString();

										guild.members.fetch(config.AdminUser)
										.then(member => {
											tools.DMUser(member, message.author + ' ' + acceptedMessage);
										});

										// guild.members.fetch(config.GregRubinUser)
										// .then(member => {
										// 	tools.DMUser(member, message.author + ' ' + acceptedMessage);
										// });

										// guild.members.fetch(config.JemUser)
										// .then(member => {
										// 	tools.DMUser(member, message.author + ' ' + acceptedMessage);
										// });

										tools.DMUser(member, 'Thank you for accepting the terms and conditions.\n\n'+
										'You must first register your Discord with your MT4 Live Account with `!register` command, before you can join Gregs channel.\n\n'+	
										'You can use it like so:\n'+
										'`!register <mt4 login>` \n ie:\n'+
										'`!register 961234`\n\n' + 
										'Once registered, you will need to click on the tick again in <#752777582772224072>');
									}
								}
							});
							break;
						}
						else if(messageContent.toLowerCase().includes('gregs channel')){

						}	
					}
				})
				.catch(console.error);
			});
		}
		catch (error) {
			tools.LogError(error);
			tools.AuthorReply(message, 'There was an error trying that command');
		}
	},
};