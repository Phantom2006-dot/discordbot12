const tools = require('../js/tools.js');
let config = tools.config;
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'myRank',
	aliases: [],
	description: 'See your rank for a given competition',
	args: true,
	usage: '<competition name>',
	cooldown: 5,
	allowedRoles:['@everyone'],
	execute(message, args) {
		try {
			if(args.length != 1) {
				return message.author.send('Please provide only 1 competition!');				
			}
			
			const competitionName = args[0]?.toLowerCase();

			const payload = {
				CompName: competitionName,
				DiscordUserId: message.author.id,
				DiscordUserName: message.author.username,
			};
			
			const endpoint = 'CompStatusController';
			tools.Log('Calling boox endpoint ' + endpoint + ' with payload ' + payload);

			tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
				if(data == null) return;	
				
				if (competitionName.startsWith(`demoequitygrowth`)
					|| competitionName.startsWith(`liveequitygrowth`)
				){
					ProcessEquityGrowth(message, args, data);
				}
				else if (competitionName.startsWith(`liveromad`)){
					ProcessLiveRomad(message, args, data);
				}
				else{
					tools.AuthorReply(message, ' this is not a valid competition! use `!openComps` to see all open competitions');
				}

				// switch(competitionName) {		
				// 	case 'demoequitygrowthjun':
				// 	case 'demoequitygrowthjul':
				// 	case 'demoequitygrowthaug':
				// 	case 'demoequitygrowthoct':
				// 	case 'liveequitygrowthfeb':
				// 	case 'liveequitygrowthmay':
				// 	case 'demoequitygrowthmar':
				// 		ProcessEquityGrowth(message, args, data);
				// 		break;
				// 	case 'liveromadfeb':
				// 	case 'liveromadmay':
				// 		ProcessLiveRomad(message, args, data);
				// 		break;
				// 	// case 'liveconsecutivewinsfeb':
				// 	// 	ProcessLiveConsecutiveWins(message, args, data);
				// 	// 	break;
				// 	default:
				// 		tools.AuthorReply(message, ' this is not a valid competition! use `!openComps` to see all open competitions');
				// }	
			}).catch(err => console.log(err));			
		}
		catch (error) {
			tools.LogError(error);
			message.reply('There was an error trying that command');
		}
	},
};

function findWithAttr(array, attr, value) {
    for(var i = 0; i < array?.length; i ++) {
        if(array?.[i]?.[attr] === value) {
            return i;
        }
    }
    return -1;
}

async function ProcessEquityGrowth(message, args, data) {	
	try {
		let compDetails = '';
		let compName = '';

		if (data.CompDetails != null) {
			compDetails = data.CompDetails; 
		}

		if (data.CompName != null) {
			compName = data.CompName; 
		}
		else {
			compName = args[0];
		}
		
		let rank = findWithAttr(data?.results, "User", message.author?.id);	
		let filteredResults;
		let user = message.author?.username;		

		if(rank == -1) {

			// try again for live comps, that store username rather than userid
			rank = findWithAttr(data.results, "User", user);
			if(rank == -1){
				return tools.AuthorReply(message, "I couldn't find you in the competition, are you sure you registered?");
			}
			
			filteredResults = data?.results?.filter(f => f.User == user)[0];		
		}
		else 
		{
			filteredResults = data?.results?.filter(f => f.User == message.author.id)[0];
			try{
				user = await message.client.users.fetch(filteredResults.User).catch(e => {throw e});		
				user = user.username;
			}
			catch 
			{
				user = filteredResults.User;		
			}
			rank++;
		}	
		
		const equity = filteredResults.Equity;		
		const growth = filteredResults.EquityGrowth;
		
		let resultString = '';
		if(rank == 1){
			rank = '🥇';
			resultString += rank + " " + user;	
		}
		else if(rank == 2){
			rank = '🥈';
			resultString += rank + " " + user;	
		}
		else if(rank == 3){
			rank = '🥉';
			resultString += rank + " " + user;	
		}	
		else {
			resultString += '**' + rank + '**. ' + user;	
		}

		// hide equity in live comps
		if(!compName.toLowerCase()?.includes('live')) resultString += ' / $' + tools.numberWithCommas(equity);			

		resultString += ' / ' + (growth * 100).toFixed(2) + '%\n';		

		const embed = new EmbedBuilder()
		.setColor(config.GPcolor)
		.setTitle('Your details for ' + compName);
		
		if(!compName.toLowerCase().includes('live')){
			embed.setDescription('**Rank / User / Current Equity / Growth**\n' + resultString);		
		} else {
			embed.setDescription('**Rank / User / Growth**\n' + resultString);
		}

		if(data.CloseDate){
			const now = new Date();
			let closeDate = new Date(data.CloseDate);

			if(closeDate < now){
				var userTimezoneOffset = closeDate.getTimezoneOffset() * 60000;
				closeDate = new Date(closeDate.getTime() - userTimezoneOffset);
				embed.setFooter({text: 'Closed at ' + closeDate.toUTCString()});			
			}
			else {
				embed.setFooter({text: 'As of ' + now.toUTCString()});
			}
		}

		// if(!data.Closed){
		// 	embed.setFooter({text:'As of ' + new Date().toUTCString()});
		// } 

		tools.ChannelSend(message, embed, JSON.stringify(data));
	} catch (err) {
		tools.LogError(err);
	}	
}

function ProcessLiveRomad(message, args, data) {
	try {
		let compDetails = '';
		let compName = '';

		if (data.CompDetails != null) {
			compDetails = data.CompDetails; 
		}

		if (data.CompName != null) {
			compName = data.CompName; 
		}
		else {
			compName = args[0];
		}

		const filteredResults = data?.results?.filter(f => f.RoMad >= 0);

		let resultString = '';
		let rank;
		for(let i = 0; i < filteredResults?.length; i++) {
			rank = i + 1;
			
			const element = filteredResults[i];

			const login = element.Login;
			const user = element.User;
			const gain = element.Gain == 0 ? 0 : (element.Gain * 100).toFixed(2);
			const maxDrawdown = element.MaxDrawdown == 0 ? 0 : (element.MaxDrawdown * 100).toFixed(2);
			const romad = element.RoMad.toFixed(2);

			if(rank == 1){
				rank = '🥇';
				resultString += rank + " " + user;	
			}
			else if(rank == 2){
				rank = '🥈';
				resultString += rank + " " + user;	
			}
			else if(rank == 3){
				rank = '🥉';
				resultString += rank + " " + user;	
			}	
			else {
				resultString += '**' + rank + '**. ' + user;	
			}
			
			resultString += ' / ' + gain + '%';			
			resultString += ' / ' + maxDrawdown + '%';				
			resultString += ' / ' + romad + '\n';				

			if(i >= 24) break;
		}

		const embed = new EmbedBuilder()
		.setColor(config.GPcolor)
		.setTitle(compName + ' Competition Leaderboard')
		.setDescription(compDetails + '\n\n' + '**User / Gain / Drawdown / RoMad**\n' + resultString)					
		.setTimestamp();	

		tools.ChannelSend(message, embed, JSON.stringify(data));
	} catch (err) {
		tools.LogError(err);
	}
}

function ProcessLiveConsecutiveWins(message, args, data) {
	try {
		let compDetails = '';
		let compName = '';
		
		if (data.CompDetails != null) {
			compDetails = data.CompDetails; 
		}

		if (data.CompName != null) {
			compName = data.CompName; 
		}
		else {
			compName = args[0];
		}	

		const filteredResults = data?.results?.filter(f => f.Equity >= 0);

		let resultString = '';
		let rank;
		for(let i = 0; i < filteredResults?.length; i++) {
			rank = i + 1;

			const element = filteredResults[i];

			const login = element.Login;
			const user = element.User;
			const closedTrades = element.NumClosedTrades;
			const ConsecutiveWins = element.NumConsecutiveWins;		
			const equityGrowth = tools.numberWithCommas((element.Equity * 100).toFixed(2));
			
			if(rank == 1){
				rank = '🥇';
				resultString += rank + " " + user;	
			}
			else if(rank == 2){
				rank = '🥈';
				resultString += rank + " " + user;	
			}
			else if(rank == 3){
				rank = '🥉';
				resultString += rank + " " + user;	
			}	
			else {
				resultString += '**' + rank + '**. ' + user;	
			}

			resultString += ' / ' + closedTrades;			
			resultString += ' / ' + ConsecutiveWins;				
			resultString += ' / ' + equityGrowth + '%\n';		
			
			if(i >= 24) break;
		}

		const embed = new EmbedBuilder()
		.setColor(config.GPcolor)
		.setTitle(compName + ' Competition Leaderboard')
		.setDescription(compDetails + '\n\n' + '**User / Closed Trades / Consecutive Wins / Equity**\n' + resultString)					
		.setTimestamp();	

		tools.ChannelSend(message, embed, JSON.stringify(data));
	} catch (err) {
		tools.LogError(err);
	}
}