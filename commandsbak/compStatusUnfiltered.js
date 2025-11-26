const tools = require('../js/tools.js');
let config = tools.config;
const Discord = require('discord.js');

function commaSeparateNumber(val) {
	while (/(\d+)(\d{3})/.test(val.toString())) {
		val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
	}
	return val;
}

module.exports = {
	name: 'compStatusUnfiltered',
	aliases: ['competition'],
	description: 'See the leaderboards for our competitions unfiltered',
	args: true,
	usage: '<competitionName>',
	cooldown: 5,
	allowedRoles:['Global Prime Team'],	
	execute(message, args) {		
		try {			
			// console.log(message.member);

			// if(message.channel.type !== 'dm' && 
			// (!message.member.roles.cache.some(r=>["Global Prime Team", "Moderator", "Ambassadors"].includes(r.name)))) {
			// 	return tools.AuthorReply(message, ' only the Global Prime Team, Moderators, and Ambassadors can call this command on public channels.\nFeel free to DM me!');
			// }

			if(args.length != 1) {
				return tools.AuthorReply(message, 'Please provide only 1 competition');				
			}

			const compNameToQuery = args[0].toLowerCase();

			const payload = {
				CompName: compNameToQuery
			};

			const endpoint = 'CompStatusController';

			tools.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
				if(data == null) return;		
								
				if (compNameToQuery.startsWith(`demoequitygrowth`)
					|| compNameToQuery.startsWith(`liveequitygrowth`)
				){
					ProcessEquityGrowth(message, args, data);
				}
				else if (compNameToQuery.startsWith(`liveromad`)){
					ProcessLiveRomad(message, args, data);
				}
				else if (compNameToQuery.startsWith(`socialintegration`)){
					ProcessSocialArmy(message, args, data);
				}
				else{
					tools.AuthorReply(message, ' this is not a valid competition! use `!openComps` to see all open competitions');
				}

				// switch(compNameToQuery) {							
				// 	case 'demoequitygrowthaug':
				// 	case 'demoequitygrowthsep':					
				// 	case 'demoequitygrowthoct':					
				// 	case 'demoequitygrowthnov':					
				// 	case 'demoequitygrowthmar':	
				// 	case 'liveequitygrowthaug':
				// 		ProcessEquityGrowth(message, args, data);
				// 		break;
				// 	case 'liveromadfeb':
				// 	case 'liveromadmay':
				// 	case 'liveromadaug':
				// 		ProcessLiveRomad(message, args, data);
				// 		break;
				// 	// case 'liveconsecutivewinsfeb':
				// 	// case 'liveconsecutivewinsmay':
				// 	// 	ProcessLiveConsecutiveWins(message, args, data);
				// 	// 	break;					
				// 	case 'socialintegrationaug':
				// 	case 'socialintegrationsep':
				// 	case 'socialintegrationoct':
				// 		ProcessSocialArmy(message, args, data);
				// 		break;
				// 	default:
				// 		tools.AuthorReply(message, ' this is not a valid competition! use `!openComps` to see all open competitions');
				// }				
			}).catch(err => console.log(err));

			if(message.author.bot && (message.author.id == config.GPBotId)) message.delete();
		} 
		catch (error) {
			tools.LogError(error);
			message.reply('there was an error trying to execute that command!');	
		}						
	},
};

async function ProcessEquityGrowth(message, args, data) {
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
	
	const filteredResults = data.results;

	let resultString = '';
	let rank;
	for(let i = 0; i < filteredResults.length; i++) {
		let element = filteredResults[i];
		
		rank = i + 1;
		let user;
		try{
			user = await message.client.users.fetch(element.User).catch(e => {throw e});		
			user = user.username;
		}
		catch 
		{
			user = element.User;		
		}

		const equity = element.Equity;		
		const growth = element.EquityGrowth;
		const login = element.Login;
	
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

		resultString += ' / ' + login;
		// hide equity in live comps
		if(!compName.toLowerCase().includes('live')) resultString += ' / $' + tools.numberWithCommas(equity);			

		resultString += ' / ' + (growth * 100).toFixed(2) + '%\n';		

		if(i >= 24) break;
	}

	const embed = new Discord.MessageEmbed()
	.setColor(config.GPcolor)
	.setTitle(compName + ' Competition Leaderboard');

	if(!compName.toLowerCase().includes('live')){
		embed.setDescription(compDetails + '\n' + '**Top 25**\n\n**User / Login / Current Equity / Growth**\n' + resultString);		
	} else {
		embed.setDescription(compDetails + '\n' + '**Top 25**\n\n**User / Login / Growth**\n' + resultString);
	}

	if(data.CloseDate){
		const now = new Date();
		let closeDate = new Date(data.CloseDate);

		if(closeDate < now){
			var userTimezoneOffset = closeDate.getTimezoneOffset() * 60000;
			closeDate = new Date(closeDate.getTime() - userTimezoneOffset);
			embed.setFooter('Closed at ' + closeDate.toUTCString());			
		}
		else {
			embed.setFooter('As of ' + now.toUTCString());
		}
	}

	// if(!data.Closed){
	// 	embed.setFooter('As of ' + new Date().toUTCString());
	// } 

	tools.ChannelSend(message, embed, JSON.stringify(data));	
}

function ProcessLiveRomad(message, args, data) {
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

	const filteredResults = data.results;

	let resultString = '';
	let rank;
	for(let i = 0; i < filteredResults.length; i++) {
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
		
		resultString += ' / ' + login;
		resultString += ' / ' + gain + '%';			
		resultString += ' / ' + maxDrawdown + '%';				
		resultString += ' / ' + romad + '\n';				

		if(i >= 24) break;
	}

	const embed = new Discord.MessageEmbed()
	.setColor(config.GPcolor)
	.setTitle(compName + ' Competition Leaderboard')
	.setDescription(compDetails + '\n\n' + '**User / Login / Gain / Drawdown / RoMad**\n' + resultString)					
	.setTimestamp();	

	tools.ChannelSend(message, embed, JSON.stringify(data));
}

function ProcessLiveConsecutiveWins(message, args, data) {
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

	const filteredResults = data.results;

	let resultString = '';
	let rank;
	for(let i = 0; i < filteredResults.length; i++) {
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
		
		if (i >= 24) break;
	}

	const embed = new Discord.MessageEmbed()
	.setColor(config.GPcolor)
	.setTitle(compName + ' Competition Leaderboard')
	.setDescription(compDetails + '\n\n' + '**User / Closed Trades / Consecutive Wins / Equity**\n' + resultString)					
	.setTimestamp();	

	tools.ChannelSend(message, embed, JSON.stringify(data));
}


async function ProcessSocialArmy(message, args, data) {
	let compDetails = '';
	let compName = '';

	if (data.CompDetails != null) {
		compDetails = data.CompDetails; 
	}

	if (data.CompName != null) {
		compName = data.CompName; 
	}
	else 
	{
		compName = args[0];
	}

	const filteredResults = data.results;
	
	if(!filteredResults){
		tools.AuthorReply(message, 'There was an error, devs are on it!');
		return;
	}
		

	let resultString = '';
	let rank;
	for(let i = 0; i < filteredResults.length; i++) {
		let element = filteredResults[i];
		rank = i + 1;
		let user;
		try{
			user = await message.client.users.fetch(element.DiscordId).catch(e => { throw e });		
			user = user.username;
		}
		catch 
		{
			user = element.DiscordId;		
		}

		const points = element.TotalPoints;		
	
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
		
		resultString += ' / ' + tools.numberWithCommas(points) + '\n';		

		if(i >= 24) break;
	}

	const thankYouMessage = 'Earn rewards for spreading the good word about Global Prime on social media. Let’s change the industry together! Available for Live Global Prime clients only.\n\n**To join, click the 🚀 emoji below!**';

	// I'm a hack
	let titleCompName = "";
	switch(compName.toLowerCase()){
		case 'socialintegrationjan':
			titleCompName = 'Social Army Competition Leaderboard - Jan 2021';
			break;
		case 'socialintegrationfeb':
			titleCompName = 'Social Army Competition Leaderboard - Feb 2021' ;
			break;
		case 'socialintegrationmar':
			titleCompName = 'Social Army Competition Leaderboard - Mar 2021' ;
			break;
		case 'socialintegrationapr':
			titleCompName = 'Social Army Competition Leaderboard - Apr 2021' ;
			break;
		case 'socialintegrationmay':
			titleCompName = 'Social Army Competition Leaderboard - May 2021' ;
			break;
		case 'socialintegrationjun':
			titleCompName = 'Social Army Competition Leaderboard - Jun 2021' ;
			break;			
		case 'socialintegrationjul':
			titleCompName = 'Social Army Competition Leaderboard - Jul 2021' ;
			break;
		case 'socialintegrationaug':
			titleCompName = 'Social Army Competition Leaderboard - Aug 2021' ;
			break;
		case 'socialintegrationsep':
			titleCompName = 'Social Army Competition Leaderboard - Sep 2021' ;
			break;
		case 'socialintegrationoct':
			titleCompName = 'Social Army Competition Leaderboard - Oct 2021' ;
			break;
		case 'socialintegrationnov':
			titleCompName = 'Social Army Competition Leaderboard - Nov 2021' ;
			break;
		case 'socialintegrationdec':
			titleCompName = 'Social Army Competition Leaderboard - Dec 2021' ;
			break;
	}

	const embed = new Discord.MessageEmbed()
	.setColor(config.GPcolor)
	.setTitle(titleCompName)	
	.setDescription(compDetails + '\n' + '**Top 25**\n\n**User / Total Points**\n' + resultString + '\n\n' + thankYouMessage);	

	tools.ChannelSend(message, embed, JSON.stringify(data)).then(m => m.react('🚀'));	
}