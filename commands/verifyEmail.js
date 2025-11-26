const tools = require('../js/tools.js');
const config = tools.config;
const axios = require('axios');
const moment = require('moment');

module.exports = {
	name: 'verifyEmail',
	aliases: [],
	description: 'This command will save email address for verification.',
	args: true,
	usage: '<useremail>',
	cooldown: 5,
	allowedRoles:['@everyone'],
	async execute(message, args) {
    try {
      const email = args[0].toLowerCase();

      const url = config.VerificationEndpoint;
      const headers = {
        "content-type": "application/json",
      };
      if (!message.channel.isDMBased()) tools.AuthorReply(message, 'This command is DM only, I\'ve started the party there!');

      // tools.DMUser(message.author, 'Excuse me, during my heavy loads this process could take minutes.');

      const res = await axios.get(`${url}/discord-users?filters[discord_id][$eq]=${message.author.id}`);

      const payload = {
        data: {
          discord_id: message.author.id,
          username: message.author.username,
          discriminator: message.author.discriminator, 
          email: email,
          verified: true,
          verified_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }
      };

      if (res.data.data[0]) {
        await axios.put(`${url}/discord-users/${res.data.data[0].id}`, JSON.stringify(payload), {
          headers: headers
        });
      } else {
        await axios.post(`${url}/discord-users`, JSON.stringify(payload), {
          headers: headers
        });
      }

      tools.DMUser(message.author, 'Congrats, you are now verified, all channels unlocked!');

      let client = message.client;
      const guild = client.guilds.cache.get(config.GPGuild);
      const member = guild?.members?.cache?.get(message.author.id);	
      member?.roles.add(config.VerifiedRoleId);
    } catch(err) {
      tools.LogError(err);
      tools.DMUser(message.author, 'There was an error trying to verify your membership.');
    }
	},
};



