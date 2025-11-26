const tools = require('../js/tools.js');
let config = tools.config;

module.exports = {
	name: 'inviteToMentorChannel',
	aliases: [],
	description: 'Used by mentors to invite users to their Channel. Only works for mentors.',
	args: true,
	dmOnly: true,
	usage: '<username>',
	cooldown: 5,
	allowedRoles:[], // no one
	execute(message, args) {
		if(!(message.author.id == config.GregRubinUser || 
			message.author.id == config.GhostRiderUser ||
			message.author.id == config.AdminUser)){
			return tools.ChannelSend(message, 'You aren\'t allowed to use this command.');
		}
		console.log(args);
		const tcs1 = 'By accessing this Global Prime Hangout (GP Hangout), you agree to the following terms and conditions. Please be advised that your continued use of the GP Hangout or the information provided herein shall indicate your consent and agreement to these terms and conditions:\n\n' +
		'1. All statements and expressions in the GP Hangout are of the nature of general comment and opinions only and are not meant as investment advice or solicitation. Information provided has been prepared without regard to a particular person’s investment objectives, suitability or risk appetite. It is not personal investment advice and neither purports to be, nor is intended to be, specific trading advice. Furthermore, this information or statements should not be considered as an offer or enticement to buy, sell or trade.\n\n' +
		'2. There is no assurance as to the accuracy or completeness of the information provided. Users of the GP Hangout agree that Global Prime Pty Ltd, its directors and its affiliates will not be liable to any person or entity for the quality, accuracy, completeness, reliability, or timeliness of the information provided on the GP Hangout, or for any direct, indirect, consequential, incidental, special or punitive damages that may arise out of the use of information we provide to any person or entity (including, but not limited to, lost profits, loss of opportunities, trading losses, and damages that may result from any inaccuracy or incompleteness of this information).\n\n' +
		'3. Trading involves substantial risk, and only those that have resources which they can afford to lose should trade. Global Prime Pty Ltd, its directors and its affiliates do not in any way guarantee that the information contained on the GP Hangout will generate profits for the User. By using the GP Hangout the User agrees to not hold liable Global Prime Pty Ltd, its directors, its affiliates or other users for losses the User may sustain while trading instruments, trading signals or trade recommendations discussed, recommend or alluded to on the GP Hangout.';

		const tcs2 = '4. Abuse of any kind will not be tolerated on the GP Hangout. Abuse includes but is not limited to verbal or written abuse of the Global Prime Pty Ltd, its directors and its affiliates; attempting to access privileged information not granted to the User or spreading security-specific information in an attempt to manipulate the price of a financial instrument. Any of these actions or other actions will be deemed by the GP Hangout to be abusive or illegal in nature and could result in an immediate ban of the User from using the GP Hangout. The User agrees not to take legal action against Global Prime Pty Ltd, its directors and its affiliates or management, or take any legal action that my directly or indirectly cause legal action to be taken against Global Prime Pty Ltd, its directors and its affiliates or management based on such disciplinary action and the User’s only course of action is to cease using the GP Hangout';
		
		try{
			let channelName;
			let roleId;
			if(config.environment == "DEV") {
				channelName = "GhostRider's";
				roleId = '737197256922628157';
			}
			else {
				if(message.author.id == config.GregRubinUser) {
					channelName = "Gregs";
					roleId = config.GregsChannelRoleId;
				} else if ( message.author.id == config.GhostRiderUser) {
					channelName = "GhostRider's";
					roleId = config.GhostRiderChannelRoleId;
				}
			}

			args.forEach(userToAdd => {				
				const user = tools.GetUserFromName(message.client, userToAdd);
				
				// user doesn't exist
				if(!user) return tools.ChannelSend(message, userToAdd + ' isn\'t a user');						
				
				const guild = message.client.guilds.cache.get(tools.workingGuildId);		
				const member = guild.members.cache.get(user.id);				

				if (member.roles.cache.has(roleId)) {
					tools.ChannelSend(message, userToAdd + ' already has that role');
				} 
				else 
				{					
					tools.DMUser(user, tcs1)
					.then(() => tools.DMUser(user, tcs2))
					.then(() =>	tools.DMUser(user, 'By reacting to this message, you accept the Terms and Conditions above.\n' + 
					'Once accepted, you\'ll be added to ' + channelName + ' channel.')
					.then(m => { m.react('👍')
					.then(() => m.react('👎'));
					}));		
					
					return tools.ChannelSend(message, 'Invite sent to ' + userToAdd);
				}
			});
		}
		catch (error) {			
			tools.LogError(error);
			message.reply('There was an error trying that command');
		}
	},
};