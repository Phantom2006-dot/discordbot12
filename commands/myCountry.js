const tools = require('../js/tools.js');
let config = tools.config;
const emojis = require('../emojis.json');
const { getCode } = require('country-list');

module.exports = {
	name: 'myCountry',
	aliases: [],
	description: 'Add a country flag to your Discord Name',
	args: true,
	usage: '<country name>',
	cooldown: 5,
	allowedRoles:['@everyone'], // no one
	async execute(message, args) {
		try{			
			const countryToAdd = args.join(' ');
			const countryCode = getCode(countryToAdd);

			if(countryCode === undefined) return tools.AuthorReply(message, countryToAdd + ' is either not a country or I don\'t recognise it as one.');				
			
			let client = message.client;	
			const guild = client?.guilds?.cache?.get('537092386824912898'); // GP Hangout guild id	
			if(guild === undefined || guild == null) return tools.AuthorReply(message, 'You\'re not a part of GP hangout server');				

			const member = guild?.members?.cache?.get(message.author.id);	

			if(member === undefined || member == null) return tools.AuthorReply(message, 'You\'re not a part of GP hangout server');				
			let flagEmoji = emojis['flag-' + countryCode.toLowerCase()];			

			if(member?.displayName?.includes(flagEmoji)) return tools.AuthorReply(message, 'You already have that emoji in your nickname');
			if(member?.displayName?.includes('[') && member?.displayName?.includes(']')) return tools.AuthorReply(message, 'You already have a flag emoji in your nickname');

			member?.setNickname(member?.displayName + ' [' + flagEmoji + ']')
			.then(() => message.react(flagEmoji));

			return tools.AuthorReply(message, 'I updated your nickname');	
		}
		catch (error) {
			tools.LogError(error);
			tools.AuthorReply(message, 'There was an error trying that command');
		}
	},
};