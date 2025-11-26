const config = require('../config.prod.json');
const crypto = require('crypto');
const axios = require('axios');
const Discord = require('discord.js');
const { EmbedBuilder } = require("discord.js");
const db = require("./db.config.js");
const Sequelize = require("sequelize");
const User = require("../js/user.model.js")(db.sequelize, Sequelize);

// Logger
require('winston-daily-rotate-file');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
	return `${timestamp.replace('T', ' ').replace('Z', '')} ${level}: ${message}`;
});

const transport = new transports.DailyRotateFile({
	filename: '%DATE%.log',
	dirname: 'logs',
	datePattern: 'YYYY-MM-DD',
	utc: true,
	// zippedArchive: true,
	maxSize: '100m',
	maxFiles: '60d',
});

const logger = createLogger({
	exitOnError: false,
	format: combine(
		timestamp(),
		format.errors({ stack: true }),
		format.splat(),
		myFormat,
	),
	transports:[
		transport,
	],
	exceptionHandlers: [
		new transports.File({ filename: 'exceptions/exceptions.log' }),
	],
});

module.exports = {
	db: db,
	User, User,
	config : config,
	logger: logger,
	workingGuildId: config.environment == "PROD" ? '537092386824912898' : '732102588031565914',
	Sleep: function(milliseconds){
		const date = Date.now();
		let currentDate = null;
		do {
		  currentDate = Date.now();
		} while (currentDate - date < milliseconds);
	},
	BooxPostCall: async function(endpoint, payload) {
		// Get HMAC keys based on environment
		const ApiId = config[config.environment + 'BooxApiHMACAppId'];
		const ApiKey = config[config.environment + 'BooxApiHMACAppKey'];
		const environment = config[config.environment + 'Endpoint'];

		// Unix timestamp in milliseconds
		const nonce = Date.now() * 1000; 

		const ApiEndpoint = environment + '/api/booxcompetition/' + endpoint + '?x=' + nonce.toString(); 

		const hashInput = ApiId + 'POST' + ApiEndpoint + nonce + JSON.stringify(payload);
	
		const hashInputBytes = StringToByteArray(hashInput, 'utf8'); 			
		const keyBytes = StringToByteArray(ApiKey, 'base64'); 	

		const keyBuffer = Buffer.from(keyBytes);
		const hashInputBuffer = Buffer.from(hashInputBytes);

		const signature = crypto.createHmac('sha256', keyBuffer).update(hashInputBuffer).digest('base64');			

		axios.defaults.headers = {
			'Content-Type': 'application/json',
			'BooX-AppId': ApiId,
			'Boox-Signature': signature,
			'BooX-Nonce': nonce,
			'X-Requested-With': 'XMLHttpRequest',
		};

		this.Log('Calling boox endpoint ' + ApiEndpoint + ' with payload ' + payload);

		return await axios.post(ApiEndpoint, payload)
			.then(response => {				
				return response.data;
			})
			.catch(e => {
				this.LogError(e);
				return e.response.data;
			});		
	},
	BooxGetCall: async function(endpoint) {
		// Get HMAC keys based on environment
		const ApiId = config[config.environment + 'BooxApiHMACAppId'];
		const ApiKey = config[config.environment + 'BooxApiHMACAppKey'];
		const environment = config[config.environment + 'Endpoint'];

		// Unix timestamp in milliseconds
		const nonce = Date.now() * 1000; 

		const ApiEndpoint = environment + '/api/booxcompetition/' + endpoint + '?x=' + nonce.toString(); 
		const hashInput = ApiId + 'GET' + ApiEndpoint + nonce;		

		const hashInputBytes = StringToByteArray(hashInput, 'utf8'); 			
		const keyBytes = StringToByteArray(ApiKey, 'base64'); 	

		const keyBuffer = Buffer.from(keyBytes);
		const hashInputBuffer = Buffer.from(hashInputBytes);

		const signature = crypto.createHmac('sha256', keyBuffer).update(hashInputBuffer).digest('base64');			
		
		axios.defaults.headers = {
			'Content-Type': 'application/json',
			'BooX-AppId': ApiId,
			'Boox-Signature': signature,
			'BooX-Nonce': nonce,
			'X-Requested-With': 'XMLHttpRequest'
		};
		logger.info('Calling boox endpoint ' + ApiEndpoint);

		return axios.get(ApiEndpoint)
			.then(response => {				
				return response.data;
			})
			.catch(e => {
				this.LogError(e);
				return e.response.data;
			});		
	},
	Log: function(message) {
		if(message.id){

			let logPrefix = '';
			if(message.channel?.isDMBased()) {
				logPrefix = 'authorId:' + message.author.id + ', Channel: DM'; 
			}
			else {
				logPrefix = 'authorId:' + message.author?.id + ', ChannelId:' + message.channelId ?? "" + ', Channel:' + message.channel?.name; 			
			}
			logger.info('(' + logPrefix + ') ' + message.author?.username + ': ' + message.content);
		}
		else {
			console.log(message);
			logger.info(message);
		}
	},
	LogError: function(error) {
		console.error(error);
		axios.post(config.slackWebhookUrl, {
            text: `An error occurred in the Discord bot: ${error.stack || error}`,
        });
		logger.error(error);
	},
	GetUserFromId: function(client, id) {
		return client.users?.cache?.find(user => user.id == id);
	},
	GetUserFromName: function(client, userName) {
		return client.users?.cache?.find(user => user.username?.toLowerCase() == userName?.toLowerCase());
	},
	AuthorSend: async function(message, response, data = null) {
		// data == null ? LogResponse(message, response) : LogResponse(message, data);
		// response = data == null ? EmbedMessage(response) : response;
		// return message.author.send(response);			

		if(data == null){
			LogResponse(message, response);

			// Split message to fit into embeds
			const embeds = await this.GetEmbeds(message);
			
			for(var i = 0; i < embeds.length - 1; i++){
				await message.author?.send({embeds: [embeds[i]]});
			}

			// return the last message sent
			return message.author?.send({embeds:[ embeds[embeds.length - 1]]});
		}
		else 
		{
			LogResponse(message, data);
			return message.author?.send(response);
		}
	},
	AuthorReply: async function(message, response, data = null) {
		data == null ? LogResponse(message, response) : LogResponse(message, data);
		if(data != null) {
			return message.reply(response);
		}
		else 
		{
			response = EmbedMessage(`${message.author}` + `, ` + `${response}`);
			return await message.channel?.send({embeds: [response]});
		}

	},
	ChannelSend: async function(message, response, data = null) {
		// data == null ? LogResponse(message, response) : LogResponse(message, data);		
		// response = data == null ? EmbedMessage(response) : response;
		// return message.channel.send(response);

		if(data == null){
			LogResponse(message, response);

			// Split message to fit into embeds
			const embeds = await this.GetEmbeds(response);
			
			for(var i = 0; i < embeds.length - 1; i++){
				await message.channel?.send({embeds: [embeds[i]]});
			}

			// return the last message sent
			return message.channel?.send({embeds: [embeds[embeds.length - 1]]});
		}
		else 
		{
			LogResponse(message, data);
			return message.channel?.send({embeds: [response]});
		}
	},
	DMUser: async function(user, message) {
		LogDM(user, message);

    // Split message to fit into embeds
    const embeds = await this.GetEmbeds(message);
    for (var i = 0; i < embeds.length - 1; i++) {
      await user.send({ embeds: [embeds[i]] });
    }

		// return the last message sent
		return user.send({embeds: [embeds[embeds.length - 1]]});
	},
	DMChannel: async function(channel, message){
		try{

			LogDM(channel, message);
			
			// Split message to fit into embeds
			const embeds = await this.GetEmbeds(message);
			
			for(var i = 0; i < embeds.length - 1; i++){
				await channel.send({embeds: [embeds[i]]});
			}
			
			// return the last message sent
			return channel.send({embeds: [embeds[embeds.length - 1]]});
		}
		catch(e){
			console.log(e);
			Log(e);
		}
	},
	numberWithCommas: function (x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	},
	GetEmbeds: async function (text) {
		// const arr = text.match(/.{1,2048}/g); 
		// const arr = text.match(/(.|[\r\n]){1,2048}/g); 	
		const arr = text.match(/[^]{1,2048}/g) 
		embeds = [];
		for (let chunk of arr) { 
			embeds.push(EmbedMessage(chunk));
		}
	
		return embeds;
	},
	CheckUserIsMT4Verified: async function(discordId) {
		const payload = {
			DiscordUserId: discordId,
		};

		const endpoint = 'CheckUserIsVerified';
		
		const data = await this.BooxPostCall(endpoint.toLowerCase(), payload);
		logger.info('Calling boox endpoint ' + endpoint + ' with payload ' + payload);
		if(data.success && data.message == true) {
			return true;
		}
		else if(data.success && data.message == false) {
			return false;
		}
		else if (!data.success){
			this.LogError(data.message);
			return false;
		}		
	},
	CheckIsValidLiveMT4Account: async function(login){

		// If not 6 digitys or not all digits then return false
		if(login.length < 6 || isNaN(login)) return false;

		const payload = {
			login: login,
		};

		const endpoint = 'CheckValidLiveMT4';
		
		const data = await this.BooxPostCall(endpoint.toLowerCase(), payload);
		logger.info('Calling boox endpoint ' + endpoint + ' with payload ' + payload);

		if(data.success && data.message == true) {
			return true;
		}
		else if(data.success && data.message == false) {
			return false;
		}
		else if (!data.success){
			this.LogError(data.message);
			return false;
		}	
	},
	AttemptToAddUserToSocialArmy: async function(user){
		try{
			const guild = user.client.guilds.cache.get(config.GPGuild);		
			// const guild = user.client.guilds.cache.get(config.A$ASGuild);		
			const member = guild?.members?.cache?.get(user.id) ?? await guild.members?.fetch(user.id);
	
			// check if user already has role
			// const alreadyHasRole = member.roles.cache.some(r=> r.id == config.RedRoleId);
			const alreadyHasRole = member?.roles?.cache?.some(r=> r.id == config.sArmyRoleId);

			if(alreadyHasRole) return module.exports.DMUser(user, 'You are already in social army! checkout <#767543150683095060>');

			let questions = [
				'What\'s your Name?',
				'What\'s your **LIVE** Global Prime MT4 account number?',
				'What\'s your Email Address?',				
				'What\'s your Instagram handle?',
				'What\'s your Facebook handle?',
				'What\'s your Youtube handle?',
				'What\'s your Twitter handle?',
				'What\'s your Linkedin handle?',
				'What\'s your ForexFactory handle?',
				'Any other FX & CFD related Social Media platforms you are a part of that you\'d like to tell us about?',
				'How large is your social media following?',
				'What is it about Global Prime that you love?',
				'If you could change anything about the forex industry what would it be?'
			];

			module.exports.DMUser(user,"Thanks for registering your interest in Global Prime Social Army.\n\n" + 
				"This is a special closed group of our biggest supporters and top contributors will be rewarded handsomely.\n\n" +
				"It’s quite simple, we show you our latest social media posts and you get points for liking, sharing and commenting.\n\n" +
				"There’s quite a few  questions to go through so please bear with us! Ready to go?"
			);
	
			let handleObject = {
				DiscordId: user.id,
				DiscordUserName: user.username
			};
			
			askQuestions(user, questions, 0, handleObject);						
		}
		catch (error) {
			module.exports.LogError(error);
			module.exports.DMUser(user, 'There was an error trying to add ' + user.username + ' to social army');
		}
	},
	verificationEndPoint: async function(req, res, client) {
		try {
			const code = req.query.code;
			if (code) {
				db.sequelize.sync();
				const response = await axios.post(
					'https://discord.com/api/oauth2/token',
					new URLSearchParams({
                	client_id: config.CLIENT_ID,
                	client_secret: config.CLIENT_SECRET,
                	grant_type: 'authorization_code',
                	code: code,
                	redirect_uri: config.REDIRECT_URI,
				}).toString(),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				});
				const userStatus = await axios.get('https://discord.com/api/v10/users/@me', {
					headers: {
						Authorization: `Bearer ${response.data.access_token}`
					}
				});
				logger.info(`${userStatus.data.global_name} discord account status fetched`);
        		const alreadyRegistered = await User.findOne({ where: { discord_id : userStatus.data.id} });
				const newUser = {
					discord_id: userStatus.data.id,
					name: userStatus.data.global_name ?? "",
					username: userStatus.data.username ?? "",
					email: userStatus.data.email ?? "",
					discriminator: userStatus.data.discriminator ?? 0,
					verified: userStatus.data.verified ?? false,
					verified_at: new Date()
				};
				const guild = await client?.guilds?.fetch(config.GPGuild);
				const guest = guild?.members?.cache?.get(newUser.discord_id);
        		if(!alreadyRegistered){ //create user if it is not already verified or registered
					await User.create(newUser);
					if(newUser?.verified){ 
						await guest?.roles?.add(config.VerifiedRoleId);
						module.exports.DMUser(guest, "Congrats, you are now verified, all channels unlocked!")
					}else{
						logger.info(`${newUser.username} doesn't have verified discord account.`)
					}
				}
				else if(!alreadyRegistered.dataValues?.verified && newUser.verified){//update user if it is not already verified
					await User.update(newUser, { where: { discord_id: userStatus.data.id } });
					if(newUser?.verified){
						await guest?.roles?.add(config.VerifiedRoleId);
						module.exports.DMUser(guest, "Congrats, you are now verified, all channels unlocked!")
					}else{
						logger.info(`${newUser.username} doesn't have verified discord account.`)
					}
				}
				else{//if user is already verified and registered
            		return res.redirect(`https://discord.com/channels/${config.GPGuild}/${config.VerificationChannelId}`);
				}
            	return res.redirect(`https://discord.com/channels/${config.GPGuild}/${config.VerificationChannelId}`);
			}
			else {
				logger.info('No authorization code received.')
        		return res.send('No authorization code received.');
			}
		}
		catch(error){
			module.exports.LogError(error);
			return error;
		}
	}
};

function StringToByteArray(message, encoding) {
	const myBuffer = [];
	const buffer = Buffer.from(message, encoding);

	for (let i = 0; i < buffer.length; i++) {
		myBuffer.push(buffer[i]);
	}

	return myBuffer;
}

function LogResponse(message, response) {
	let logPrefix = '[Responding To] ';
	
	if(message.channel === undefined) return;

	if(message.channel.isDMBased()) {
		logPrefix += 'authorId:' + message.author.id + ', Channel: DM'; 
	}
	else {
		logPrefix += 'authorId:' + message.author.id + ', ChannelId:' + message.channelId + ', Channel:' + message.channel.name; 			
	}
	logger.info('(' + logPrefix + ') ' + response);
}

function LogDM(user, message) {
	const logPrefix = '[Sending DM To] (' + user.id + ') ' + user.username + ': ';
	logger.info(logPrefix + message);
}

function EmbedMessage(message){
	const embed = new EmbedBuilder()
	.setColor(config.GPcolor)
	.setDescription(message)	

	return embed;
}

async function askQuestions(user, questions, i, handleObject){
	if (i == questions.length){
		// module.exports.ChannelSend(message, 'What\'s your ' + handles[i] + '? (Message me your answer or `no` to skip)
		if(Object.keys(handleObject).length <= 2){
			return module.exports.DMUser(user, 'You\'ve entered none of your handles! aborting');
		} 

		enterUserToSocialIntegration(user, handleObject);
		
		return;
	}

	let m = await module.exports.DMUser(user, questions[i] + (questions[i].toLowerCase().includes("account number") ? '' : ' (Message me your answer or `skip` to skip)'));
	const collector = new Discord.MessageCollector(m.channel, m => m.author.id === user.id, { time: 60000 * 5});
	collector.once('collect', async response => {
		if (response.content.toLowerCase() == 'skip') {			
			if(questions[i].toLowerCase().includes("account number")){				
				module.exports.DMUser(user, "Unfortunately you can't skip this one... Please try again with a **LIVE** account. To try again, you can type `!EnterSocialArmy`");
			}
			else {
				return collector.stop();
			}
		} 
		else 
		{		
			if(questions[i].toLowerCase().includes("account number")){				
				const isValidAccount = await module.exports.CheckIsValidLiveMT4Account(response.content);
				if(!isValidAccount){
					return module.exports.DMUser(user, "That's not a valid live account! When you're ready to try again with a valid account, type `!EnterSocialArmy`");					
				}									
			}

			handleObject[questions[i]] = response.content;
			collector.stop();
		} 
    });

    //Repeat if guesses still exist
    collector.on('end', collected => {		
		if(Array(collected)?.length === 0){
			return module.exports.DMUser(user, 'I didn\'t get a response in time! aborting. If you\'d like to try again, type `!EnterSocialArmy`');
		}
        else if(i < questions.length) {
			askQuestions(user, questions, ++i, handleObject);
		}
    });
}

function enterUserToSocialIntegration(user, userHandles) {
	const payload = {
		DiscordUserId: user.id,		
		DiscordUserName: user.username,
		userHandles: userHandles
	};

	console.log(payload);

	const endpoint = 'EnterSocialArmy';
	logger.info('Calling boox endpoint ' + endpoint + ' with payload ' + payload);

	module.exports.BooxPostCall(endpoint.toLowerCase(), payload).then(data => {
		if(data == null || data === undefined) return;

		console.log(JSON.stringify(data));

		if(!data.success && data.message != '') {
			module.exports.DMUser(user, data.message);
		}
		else if(data.success) {			
			const guild = user.client.guilds.cache.get(config.GPGuild);	
			// const guild = user.client.guilds.cache.get(config.A$ASGuild);	
			const member = guild?.members?.cache?.get(user.id);	
			member?.roles.add(config.sArmyRoleId);
			// member.roles.add(config.RedRoleId);
			
			module.exports.DMUser(user, "Thank you so much for sticking through the questions! You have now got access to <#767543150683095060> channel!\n\n"+ 
				"We will post links to social content that we put out and you’ll be able to show us when you like, comment or share the post.\n\n"+
				"We’ll see you at <#767543150683095060> 😊"
			);

			module.exports.DMUser(user.client.users.cache.get(config.willUser), user.username + ' just joined social army! Answers:' + JSON.stringify(userHandles));
			module.exports.DMUser(user.client.users.cache.get(config.JemUser), user.username + ' just joined social army! Answers:' + JSON.stringify(userHandles));
		}		
	}).catch(err => {
		module.exports.LogError(err);
	});
}