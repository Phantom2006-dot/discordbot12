const tools = require('../js/tools.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'openComps',
	aliases: ['opencomp'],
	description: 'Get all currently running competitions',
	args: false,
	usage: '',
	cooldown: 5,
	allowedRoles:['@everyone'], // no one
	execute(message) {
		try{			
			const endpoint = 'getOpenComps';
			tools.Log('Calling boox endpoint ' + endpoint);

			tools.BooxGetCall(endpoint.toLowerCase()).then(data => {
				if(data == null || data === undefined) return;
				data.forEach(comp => {
					const compDetails = new EmbedBuilder()
						.setColor('#b7eb34')
						.setTitle(comp.CompetitionName)
						.setDescription(comp.CompetitionDetails.replace("'","\'"))
						.addFields(
							{ name: 'Start Date', value: comp.StartDate, inline: false },
							{ name: 'End Date', value: comp.EndDate, inline: false },
						);
				
					if(comp.RegistrationOpen) compDetails.addFields({name: 'Registration Open', value: comp.RegistrationOpen});
					if(comp.RegistrationClose) compDetails.addFields({name: 'Registration Close', value: comp.RegistrationClose});

					message.channel.send({embeds: [compDetails]});
				});
			}).catch(err => tools.LogError(err));
			
		}
		catch (error) {
			tools.LogError(error);
			message.reply('There was an error trying that command');
		}
	},
};