const { ConsoleTransportOptions } = require('winston/lib/winston/transports');
const { client } = require('../js/globalprimediscordbot.js');
const tools = require('../js/tools.js');
let config = tools.config;

module.exports = {
	name: 'mentorReport',
	aliases: [],
	description: '',
	dmOnly: true,
	cooldown: 5,
	allowedRoles:['Global Prime Team'], // no one
	async execute(message, args) {
		try{
			const endpoint = 'GetVerifiedDiscordAccounts';

			let mentorToGet = [];
			if(message.author.id == config.GregRubinUser){
				mentorToGet.push(config.GregsChannelRoleId);
			}
			else if(message.author.id == config.IvanUser){
				mentorToGet.push(config.IvanChannelRoleId);
			}
			else if(message.author.id == config.AdminUser){
				if (args[0] !== undefined){
					const configToPush = args[0].toLowerCase() == "greg" ? config.GregsChannelRoleId : config.IvanChannelRoleId;
					mentorToGet.push(configToPush);
				}
				else 
				{
					mentorToGet.push(config.GregsChannelRoleId);
					mentorToGet.push(config.IvanChannelRoleId);
					mentorToGet.push(config.RedRoleId);
				}
			}
			else {
				return tools.AuthorSend(message, "You can't pass here!");
			}							

			const guildId = config.environment == "PROD" ? config.mentorGuild : config.A$ASGuild; 	
			const guild = client.guilds.cache.find(x => x.id == guildId);
			
			const allMembers = await guild.members.fetch({ force: true,  cache: true }).catch(console.log);

			const channelId = config.environment == "PROD" ? config.chooseYourMentorChannel : '732102588031565917';
			const channel = guild.channels.cache.find(x => x.id == channelId);			
						
			tools.BooxGetCall(endpoint.toLowerCase())
			.then(data => {					
				mentorToGet.forEach(async mentorRoleId => {						
					const allMembersThatHaveRole = Array.from(allMembers.values()).filter(x => x.roles.cache.some(role => role.id == mentorRoleId));				
					
					// We filter this later on
					let allMembersThatHaveRoleAndNotReacted = allMembersThatHaveRole;
					
					let messageIdToGet = mentorRoleId == config.GregsChannelRoleId ? config.GregInviteMessageId :
											mentorRoleId == config.IvanChannelRoleId ? config.IvanInviteMessageId : null;

					messageIdToGet = config.environment == "PROD" ? messageIdToGet : '808473491006291968';				
					if (messageIdToGet == null) return;					

					const messageToGetReactions = await channel.messages.fetch(messageIdToGet).catch(console.log);
					const reactions = messageToGetReactions.reactions.cache;

					for (const reaction of reactions) {			
						const usersMap = await fetchReactionUsers(reaction[1]);			
						const users = Array.from(usersMap.values());

						// Sort alphabetically on discord username
						users.sort((a, b) => (a.username.toUpperCase() > b.username.toUpperCase()) ? 1 : -1);
						
						let response = "Accounts that reacted to: " + reaction[1].emoji.name + '\n';
						response += "*To be in this list a user is still a member of the server, and reacted to the ebove emoji*\n\n";
						response += '**username, account number, account Name, verified, has role**\n';														
				
						users.forEach(u => {
							// if not member means they left the server
							let member = allMembers.get(u.id);			
							if(member !== undefined){																	
								// if found that means they reacted to an emoji, remove them from allMembersThatHaveRoleAndNotReacted
								const i = allMembersThatHaveRoleAndNotReacted.findIndex(x => x.user.id == u.id);
								if(i >= 0) allMembersThatHaveRoleAndNotReacted.splice(i, 1);

								let hasRole = member.roles.cache.some(role => role.id == mentorRoleId);
								
								let verifiedUser = data.find(x => x.VerificationOrigin == u.id)
								if(verifiedUser !== undefined){												
									response += u.username + "," + verifiedUser.VerificationSource + "," + verifiedUser.Name  + ",true," + hasRole + "\n";				
								}		
								else 
								{
									response += u.username + "," + "unknown,unknown,false," + hasRole + "\n";				
								}
							}
						});		

						await tools.ChannelSend(message, response);	
					}	
					let usersWhoHaveRoleAndNotReactedResponse = "**The following users have your role but haven't reacted to any emoji:**\n" + 
																allMembersThatHaveRoleAndNotReacted.map(u => u.user.username).join(",");

					tools.ChannelSend(message, usersWhoHaveRoleAndNotReactedResponse);	
				});
			})
			.catch(err => tools.LogError(err));
		}
		catch (error) {
			tools.LogError(error);
			tools.AuthorReply(message, 'There was an error trying that command');
		}
	},
};

function fetchReactionUsers(reaction, limit = 1000) {
	return new Promise((resolve, reject) => {
	  reaction.users.fetch({limit: limit < 100 ? limit : 100})
	  .then(collection => {		
		const nextBatch = () => {
			let remaining = limit - collection.size;
		  	reaction.users.fetch({limit: remaining < 100 ? remaining : 100, after: collection.lastKey()})
		  	.then(next => {								
				let concatenated = collection.concat(next);					

				// resolve when limit is met or when no new msgs were added (reached beginning of channel)				
				if (collection.size >= limit || collection.size == concatenated.size) {
					return resolve(concatenated);
				}

				collection = concatenated;
				nextBatch();
			})
			.catch(error => reject(error));
		}  
		nextBatch();
	  })
	  .catch(error => reject(error));
	});
  }