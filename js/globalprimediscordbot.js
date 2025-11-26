const fs = require("fs");
const express = require("express");

const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  EmbedBuilder
} = require("discord.js");
const path = require("path");
const tools = require("./tools.js");
const socialArmy = require("./socialArmy.tools.js");
tools.Log("Using config: " + JSON.stringify(tools.config));
let config = tools.config;
let prefix = config.prefix;
let token = config.token;
const app = express();

// GLOBALS
const rootDir = path.resolve("./");
let postedAlready = false;
// let UpdatedCompAlready = false;
let currentHour = -1;

app.get('/verification', async (req, res) => {
    try{
    tools.verificationEndPoint(req, res, client);
} catch (error) {
        console.error('Error verifying user:', error);
        tools.LogError('Error verifying user: ' + error)
        res.status(500).send('An error occurred.');
    }
});

app.listen(config.PORT, () => {
    console.log(`Server is running at http://localhost:${config.PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
const cooldowns = new Collection();

// Load in commands
const commandFiles = fs
  .readdirSync(rootDir + "/commands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(rootDir + "/commands/" + file);
  client.commands.set(command.name.toLowerCase(), command);
}

client.once("ready", () => {
  tools.Log(`${client.user.username} Ready!`);
  client.user.setActivity("blend in with the humans");
});

client.on("messageCreate", async (message) => {
  try {
    if (
      message.author?.id == config.AdminUser &&
      message.content?.includes("youtube")
    ) {
      PostNewYoutubeVideo(message.content);
      return;
    }

    // Don't listen to messages from other bots
    if (
      message.author?.bot &&
      message.author?.id != "748329459198984334" &&
      message.author?.id != config.GPBotId
    )
      return;

    // Not a command
    if (!message.content?.startsWith(prefix)) return;

    message.channel?.sendTyping();
    // log first command user sends
    tools.Log(message);

    if (
      !message.channel?.isDMBased() &&
      message.author?.id !== config.GPBotId &&
      message.channelId != config.GlobalPrimeBotChannelId &&
      message.channelId != "767543150683095060" && // s-army channel
      message.guildId != config.A$ASGuild
    ) {
      return tools.AuthorReply(
        message,
        "I'm only active on <#" +
          config.GlobalPrimeBotChannelId +
          ">. Send me a message there or send me a DM!"
      );
    }
    // if(message.guilds.id == config.mentorGuild) return tools.AuthorReply("This command doesn't work in the mentors channel");

    const args = message.content?.slice(prefix.length)?.split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!message.channel?.isDMBased() && commandName == "rank") return;

    // Run commands
    const command =
      client.commands?.get(commandName) ||
      client.commands?.find(
        (cmd) => cmd.aliases && cmd.aliases?.includes(commandName)
      );

    // If command doesn't exist
    if (!command) {
      return tools.ChannelSend(
        message,
        `'${commandName}' command doesn't exist, ${message.author}!`
      );
    }
    const guilds = client.guilds.cache;
    const asasGuild = guilds?.get(config.A$ASGuild);
    const MentorGuild = guilds?.get(config.mentorGuild);
    const GpGuild = guilds?.get(config.GPGuild);
    // const guild = client.guilds.cache.get('732102588031565914');
    const asasMember = !asasGuild
      ? false
      : asasGuild?.members?.cache?.get(message.author?.id);
    const mentorMember = !MentorGuild
      ? false
      : MentorGuild?.members?.cache?.get(message.author?.id);
    const GPMember = !GpGuild
      ? false
      : GpGuild?.members?.cache?.get(message.author?.id);

    if (!asasMember && !mentorMember && !GPMember)
      return tools.AuthorReply(
        message,
        "You're not part of the guild with this ID."
      );

    // If server only command
    if (command.guildOnly && !message.channel?.isTextBased()) {
      return tools.AuthorReply(
        message,
        "I can't execute that command inside DMs!"
      );
    }

    // If dm only command
    if (command.dmOnly && !message.channel?.isDMBased()) {
      tools.AuthorReply(
        message,
        "This command does not work in channels, please DM me! I'll message you hello now"
      );
      return tools.DMUser(
        message.author,
        `Hi ${message.author}, did you need me? type \`!help\` to see my commands`
      );
    }

    if (
      command.allowedRoles !== undefined &&
      asasMember &&
      !asasMember?.roles?.cache?.some((role) =>
        command.allowedRoles?.includes(role.name)
      ) &&
      mentorMember &&
      !mentorMember?.roles?.cache?.some((role) =>
        command.allowedRoles?.includes(role.name)
      ) &&
      GPMember &&
      !GPMember?.roles?.cache?.some((role) =>
        command.allowedRoles?.includes(role.name)
      )
    ) {
      return tools.AuthorReply(message, "You don't have the role to do that!");
    }

    if (command.args && !args.length) {
      let reply = `You didn't provide any arguments, ${message.author}!`;

      if (command.usage) {
        reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
      }

      return tools.ChannelSend(message, reply);
    }

    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const coolDownTimestamps = cooldowns.get(command.name);

    // default 3 seconds
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (coolDownTimestamps.has(message.author?.id)) {
      const expirationTime =
        coolDownTimestamps.get(message.author?.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return tools.AuthorReply(
          message,
          `please wait ${timeLeft.toFixed(
            1
          )} more second(s) before reusing the \`${command.name}\` command.`
        );
      }
    }

    // Only apply timeout for users that arent gpbot or gpbotdev
    if (
      message.author?.id != "748329459198984334" &&
      message.author?.id != config.GPBotId
    )
      coolDownTimestamps.set(message.author?.id, now);

    setTimeout(
      () => coolDownTimestamps.delete(message.author?.id),
      cooldownAmount
    );

    try {
      tools.Log(`Executing command: ${commandName}`);
      command.execute(message, args);
      tools.Log(`Command ${commandName} executed successfully`);
    } catch (error) {
      tools.LogError(error);
      tools.AuthorReply(
        message,
        "there was an error trying to execute that command! Devs are on it"
      );
      throw error;
    }
  } catch (e) {
    console.error(e);
    tools.LogError(e);
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  try
  {
    // Skip bot reacts
    if (user.bot) {
      tools.Log(`${user} is bot. Cannot react to messages`);
      return;
    }
    if (reaction.partial) {
      await reaction.fetch();
      tools.Log('Reaction fetched.');
    }
    if (reaction.message.partial) {
      await reaction.message.fetch();
      tools.Log('Reaction message fetched.');

    }
    const { message, emoji } = reaction;

    // IF gpbot sent the message and it's in dm
    if (
      message.author?.bot &&
      // message.author.id === config.GPBotId &&
      !user.bot &&
      (message.content?.includes("Gregs channel") || 
        message.embeds?.filter((e) =>
        e.description?.toLowerCase()?.includes("gregs channel")
      ).length > 0) &&
      message.channel?.isDMBased() &&
      message.channel?.recipient?.id !== user.id
    ) {
      const embed = message.embeds?.[0];
      if (embed.footer && embed.footer.text === "Accepted")
        return tools.DMUser(
          client.users?.cache?.get(user.id),
          "You already accepted!"
        );

      // const guild = client.guilds.cache.get('732102588031565914');
      var fortnightAway = new Date(Date.now() + 12096e5);
      switch (emoji.name) {
        case "👍":
          const emb = new EmbedBuilder(embed)?.setFooter({ text: "Accepted" });
          await message.edit(emb);
          //test
          tools.DMUser(
            user,
            "Thanks " +
              user.username +
              "! Please complete your subscription payment and start your 14 day free trial: https://argamon.com/mentors/.\n\n" +
              "Once done, please send a message to <@" +
              config.GregRubinUser +
              "> to be added to the room. See you there!"
          );

          tools.DMUser(
            client.users?.cache?.get(config.GregRubinUser),
            user.username +
              " accepted Gregs T&C's, stripe link sent (https://argamon.com/mentors/greg60/), Trial expires " +
              fortnightAway?.toDateString()
          );
          tools.DMUser(
            client.users?.cache?.get(config.AdminUser),
            user.username +
              " accepted Gregs T&C's, stripe link sent (https://argamon.com/mentors/greg60/), Trial expires " +
              fortnightAway?.toDateString()
          );

          break;
      }
    } else if (
      message.author?.bot &&
      !user.bot &&
      (message.content?.toLowerCase()?.includes("ivan") ||
        message.embeds?.filter((e) => e.description?.toLowerCase()?.includes("ivan"))
        .length > 0) &&
      message.channel?.isDMBased() &&
      message.channel?.recipient?.id == user.id
    ) {
      const embed = message.embeds?.[0];
      if (embed.footer && embed.footer?.text === "Accepted")
        return tools.DMUser(
        client.users?.cache?.get(user.id),
        "You already accepted!"
      );

      const guild = client.guilds?.cache?.get(config.mentorGuild);
      // const guild = client.guilds.cache.get('732102588031565914');
      const member = guild?.members?.cache?.get(user.id) ?? await guild?.members?.fetch(user.id);

      switch (emoji.name) {
        case "👍":  
        const embeding = new EmbedBuilder(embed)?.setFooter({ text: "Accepted" });
        await message.edit(embeding);
          let messageToScrape = message.embeds?.[0]?.description?.toLowerCase();

          const startIndex =
          messageToScrape.indexOf("you reacted to:") + "you reacted to:".length;
          let subscriptionEmoji = messageToScrape.substring(
            startIndex + 1,
            startIndex + 3
          );

          if (!config.IvanMentorRoleEmojis?.includes(subscriptionEmoji)) {
            tools.DMUser(
              client.users?.cache?.get(config.AdminUser),
              user.username +
                ' got "' +
                subscriptionEmoji +
                '" as subscriptionEmoji?'
            );
            tools.DMUser(
              user,
              "There has been an error, devs have been notified and working on it!"
            );
            break;
          }

          let subscriptionService = "";
          let assignRole = false;
          switch (subscriptionEmoji) {
            case "🐶":
              assignRole = true;
              subscriptionService = "1 month: USD 50 (standard fee)";
              break;
            case "🐱":
              assignRole = true;
              subscriptionService = "3 months: USD 150";
              break;
            case "🐭":
              assignRole = true;
              subscriptionService = "6 months: USD 250 (1 month free)";
              break;
            case "🐹":
              assignRole = true;
              subscriptionService = "1 year: USD 450 (3 month free)";
              break;
            default:
              tools.DMUser(user, "Thant's not a valid emoji!");
              break;
          }

          // check if user is verified
          const userVerified = await tools.CheckUserIsMT4Verified(user.id);
          if (userVerified) {
            var fortnightAway = new Date(Date.now() + 12096e5);
            if (assignRole) {
              member?.roles
                .add(config.IvanChannelRoleId)
                .then(() => {
                  let returnVerificationMessage =
                    user.username +
                    " accepted Ivans T&C's and verified mt4.\n" +
                    "Chosen subscription service: " +
                    subscriptionEmoji +
                    " - " +
                    subscriptionService +
                    "\nMentor role added, free trial expires " +
                    fortnightAway.toDateString();

                  tools.DMUser(
                    client.users?.cache?.get(config.IvanUser),
                    returnVerificationMessage
                  );
                  tools.DMUser(
                    client.users?.cache?.get(config.AdminUser),
                    returnVerificationMessage
                  );
                  tools.DMUser(
                    client.users?.cache?.get(config.JemUser),
                    returnVerificationMessage
                  );

                  tools.DMUser(user, "You've been added to Ivans mentor room!");

                  const welcomeMessage = config.welcomeMessages[
                    Math.floor(Math.random() * config.welcomeMessages?.length)
                  ].replace("DiscordUser123", user.username);
                  const generalChannel = client.channels?.cache?.find(
                    (channel) => channel.id == config.IvanGeneralChannel
                  );
                  tools.DMChannel(generalChannel, welcomeMessage);
                })
                .catch((e) => {
                  console.log(e);
                  tools.LogError(e);
                });
            } else {
              const returnMessage =
                user.username +
                " accepted Ivans T&C's and verified mt4.\n" +
                "Chosen subscription service: " +
                subscriptionEmoji +
                " - " +
                subscriptionService +
                "\nMentor role not added, message sent to user asking for chosen room.\nFree trial expires " +
                fortnightAway?.toDateString();

              tools.DMUser(
                client.users?.cache?.get(config.IvanUser),
                returnMessage
              );
              tools.DMUser(
                client.users?.cache?.get(config.AdminUser),
                returnMessage
              );
              tools.DMUser(client.users?.cache?.get(config.JemUser), returnMessage);

              tools.DMUser(
                user,
                "You've been successfully registered! Please DM Ivan with the room you would like access to"
              );
            }
          } else {
            let failedMessage =
              user.username +
              " accepted Ivans T&C's but didn't verify mt4 yet.\n" +
              "Chosen subscription service: " +
              subscriptionEmoji +
              " - " +
              subscriptionService;

            tools.DMUser(client.users?.cache?.get(config.AdminUser), failedMessage);
            tools.DMUser(client.users?.cache?.get(config.IvanUser), failedMessage);

            tools.DMUser(
              user,
              "Thank you for accepting the terms and conditions.\n\n" +
                "You must first register your Discord with your MT4 Live Account with `!register` command, before you can join Ivans channel.\n\n" +
                "You can use it like so:\n" +
                "`!register <mt4 login>` \n ie:\n" +
                "`!register 961234`\n\n" +
                "Once registered, you will need to click on the tick again in <#752777582772224072>"
            );
          }
          break;
      }
    } else if (
      message.author.bot &&
      // message.author.id === config.GPBotId &&
      !user.bot &&
      (message.content?.includes("GhostRider's channel") ||
        message.embeds?.filter((e) =>
          e.description?.toLowerCase()?.includes("ghostrider's channel")
        ).length > 0) &&
      message.channel?.isDMBased() &&
      message.channel?.recipient?.id == user.id
    ) {
      const embed = message.embeds?.[0];
      if (embed.footer && embed.footer?.text === "Accepted")
        return tools.DMUser(
          client.users?.cache?.get(user.id),
          "You already accepted!"
        );

      const guild = client.guilds?.cache?.get(config.mentorGuild);
      // const guild = client.guilds.cache.get('732102588031565914');
      const member = guild?.members?.cache.get(user.id);

      switch (emoji.name) {
        case "👍": 
        const embeding = new EmbedBuilder(embed)?.setFooter({ text: "Accepted" });
        await message.edit(embeding);
          // member.roles.add('737197256922628157')
        member?.roles
            .add(config.GhostRiderChannelRoleId)
            .then(() => {
              tools.DMUser(
                client.users?.cache?.get(config.AdminUser),
                user.username + " accepted GhostRider's  T&C's, mentor role added"
              );
              tools.DMUser(
                client.users?.cache?.get(config.JemUser),
                user.username + " accepted GhostRider's  T&C's, mentor role added"
              );
              tools.DMUser(
                client.users?.cache?.get(config.GhostRiderUser),
                user.username + " accepted GhostRider's  T&C's, mentor role added"
              );
              tools.DMUser(
                user,
                user.username +
                  " All Done! you now have access to GhostRider's channel.\nEnjoy!"
              );

              // const welcomeMessage = config.welcomeMessages[Math.floor(Math.random() * config.welcomeMessages.length)].replace('DiscordUser123', user);
              // const generalChannel = client.channels.cache.find(channel => channel.id == config.GhostRiderGeneralChannel);
              // tools.DMChannel(generalChannel, welcomeMessage);
            })
            .catch((e) => {
              tools.LogError(e);
            });
          break;
      }
    } else if (
      message.author?.bot &&
      // message.author.id === config.GPBotId &&
      !user.bot &&
      (message.content?.includes("Alex's channel") ||
        message.embeds?.filter((e) =>
          e.description.toLowerCase()?.includes("alex's channel")
        ).length > 0) && message.channel.isDMBased() && message.channel?.recipient?.id == user.id
    ) {
      const embed = message.embeds?.[0];
      if (embed.footer && embed.footer?.text === "Accepted")
        return tools.DMUser(
          client.users?.cache?.get(user.id),
          "You already accepted!"
        );

      const guild = client.guilds?.cache?.get(config.mentorGuild);
      // const guild = client.guilds.cache.get('732102588031565914');
      const member = guild?.members?.cache?.get(user.id) ?? await guild?.members?.fetch(user.id);
      switch (emoji.name) {
        case "👍":
          const embeding = new EmbedBuilder(embed)?.setFooter({ text: "Accepted" });
          await message.edit(embeding);

          // member.roles.add('737197256922628157')
          member?.roles
            .add(config.AlexChannelRoleId)
            .then(() => {
              tools.DMUser(
                client.users?.cache?.get(config.AdminUser),
                user.username + " accepted Alex's T&C's, mentor role added"
              );
              tools.DMUser(
                client.users?.cache?.get(config.JemUser),
                user.username + " accepted Alex's T&C's, mentor role added"
              );
              tools.DMUser(
                client.users?.cache?.get(config.AlexUser),
                user.username + " accepted Alex's T&C's, mentor role added"
              );
              tools.DMUser(
                user,
                user.username +
                  " All Done! you now have access to Alex's channel.\nEnjoy!"
              );

              // const welcomeMessage = config.welcomeMessages[Math.floor(Math.random() * config.welcomeMessages.length)].replace('DiscordUser123', user);
              // const generalChannel = client.channels.cache.find(channel => channel.id == config.AlexGeneralChannel);
              // tools.DMChannel(generalChannel, welcomeMessage);
            })
            .catch((e) => {
              tools.LogError(e);
            });
          break;
      }
    } else if (message.id == config.GregInviteMessageId && emoji.name == "✅") {
      const guild = client.guilds?.cache?.get(config.mentorGuild);
      const member = guild?.members?.cache?.get(user.id);

      // check if user already has role
      const alreadyHasRole = member?.roles?.cache?.some((r) =>
        [config.GregsChannelRoleId, "737197256922628157"].includes(r.id)
      );

      if (alreadyHasRole)
        return tools.DMUser(user, "You are already in Greg's channel");
      var fortnightAway = new Date(Date.now() + 12096e5);

      let verificationMessage =
        "Hi.\nYou have a 2 week free trial to Gregs channel, which will expire on " +
        fortnightAway.toDateString() +
        ", After which you will charged a monthly fee of US$60 for access to the Channel. \n\nBy clicking the " +
        "👍" +
        " emoji, you hereby accept the Terms And Conditions above.You will be charged monthly on a recurring basis until you choose to terminate your subscription. Your access to the Channel can be terminated at any time by providing notice to support@globalprime.com. Once terminated, you will not be charged for the following month’s subscription however no refund will be given for the period that has been paid for.";

      PostTandC(user)
        .then(() => tools.DMUser(user, verificationMessage))
        .then((m) => {
          m.react("👍");
        });
    } else if (
      message.id == config.IvanInviteMessageId &&
      config.IvanMentorRoleEmojis?.includes(emoji.name)
    ) {
      const guild = client.guilds?.cache?.get(config.mentorGuild);
      // const guild = client.guilds.cache.get(config.A$ASGuild);
      const member = guild?.members?.cache?.get(user.id);

      // check if user already has role
      const alreadyHasRole = member?.roles?.cache?.some((r) =>
        [config.IvanChannelRoleId, "737197256922628157"].includes(r.id)
      );

      if (alreadyHasRole)
        return tools.DMUser(
          user,
          "You are already in Ivan's channel. If you want to change your subscription service, please message Ivan directly."
        );

      var fortnightAway = new Date(Date.now() + 12096e5);

      let subscriptionService = "";
      switch (emoji.name) {
        case "🐶":
          subscriptionService = "1 month: USD 50 (standard fee)";
          break;
        case "🐱":
          subscriptionService = "3 months: USD 150";
          break;
        case "🐭":
          subscriptionService = "6 months: USD 250 (1 month free)";
          break;
        case "🐹":
          subscriptionService = "1 year: USD 450 (3 month free)";
          break;
        default:
          return;
      }

      // let verificationMessage = 'Hi.\nYou have a 2 week free trial to Ivans channel, which will expire on ' + fortnightAway.toDateString() + ', After which Global Prime will charge a monthly fee of US$50 for access to the Channel. \n\nBy clicking the ' + '👍' + ' emoji, you hereby accept the Terms And Conditions above, as well as authorise Global Prime to deduct this fee from your MT4 account on the 14th day of each month.\nYour access to the Channel can be terminated at any time by providing notice to support@globalprime.com. Any unused access fee for the month in which notice to terminate has been given will be calculated and refunded to your MT4 account on a pro rate basis'
      // let verificationMessage = 'Hi.\nIvan\'s channel will be moving to subscription only from January 19th 2021. The fee is $35(US)/month if you join before this date, or $50(US)/month after. \n\nBy clicking the ' + '👍' + ' emoji, you hereby accept the Terms And Conditions above, as well as authorise Global Prime to deduct this fee from your MT4 account on the 14th day of each month.\nYour access to the Channel can be terminated at any time by providing notice to support@globalprime.com. Any unused access fee for the month in which notice to terminate has been given will be calculated and refunded to your MT4 account on a pro rate basis'

      const introductionMessage =
        "Hi.\nThank you for choosing to enter Ivan's mentor room.\nPlease read the following Terms and Conditions.\n Once ready, click on the " +
        "👍" +
        " emoji below.";
      // const verificationMessage = 'By clicking the ' + '👍' + ' emoji:\n\n' +
      // '- You accept the Terms and Conditions as laid out above.\n\n'+
      // '- You understand your access to Ivan\'s channel can be terminated at any time.\n\n'+
      // 'Please click on ' + '👍' + ' if you agree to the terms above.';

      let verificationMessage =
        "Hi " +
        user.username +
        ",\n\n" +
        "You reacted to: " +
        emoji.name +
        "- " +
        subscriptionService +
        ".\n" +
        "If this is a mistake please go back and react to your intented symbol to receive this message again.\n\n" +
        "By clicking the " +
        "👍" +
        " emoji, you hereby accept the Terms And Conditions above, as well as authorise Global Prime to deduct this fee from your MT4 account.\nYour access to Ivan's channel can be terminated at any time by providing notice to Ivan. Any unused access fee for the month in which notice to terminate has been given will be calculated and refunded to your MT4 account on a pro rate basis";

      tools
        .DMUser(user, introductionMessage)
        .then(() => PostTandC(user))
        .then(() => tools.DMUser(user, verificationMessage))
        .then((m) => {
          m.react("👍");
        });
    } else if (
      message.id == config.GhostRiderInviteMessageId &&
      emoji.name == "👻"
    ) {
      // const guild = client.guilds.cache.get('732102588031565914');
      const guild = client.guilds?.cache?.get(config.mentorGuild);
      const member = guild?.members?.cache?.get(user.id);

      // check if user already has role
      const alreadyHasRole = member?.roles?.cache?.some((r) =>
        [config.GhostRiderChannelRoleId, "737197256922628157"].includes(r.id)
      );
      if (alreadyHasRole)
        return tools.DMUser(user, "You are already in GhostRider's channel");

      const introductionMessage =
        "Hi.\nThank you for choosing to enter GhostRider's mentor room.\nPlease read the following Terms and Conditions.\n Once ready, click on the " +
        "👍" +
        " emoji below.";
      const verificationMessage =
        "By clicking the " +
        "👍" +
        " emoji:\n\n" +
        "- You accept the Terms and Conditions as laid out above.\n\n" +
        "- You understand your access to GhostRider's channel can be terminated at any time.\n\n" +
        "Please click on " +
        "👍" +
        " if you agree to the terms above.";

      tools
        .DMUser(user, introductionMessage)
        .then(() => PostTandC(user))
        .then(() => tools.DMUser(user, verificationMessage))
        .then((m) => {
          m.react("👍");
        });
    } else if (message.id == config.AlexInviteMessageId && emoji.name == "👑") {
      const guild = client.guilds?.cache?.get(config.mentorGuild);
      const member = guild?.members?.cache?.get(user.id);

      // check if user already has role
      const alreadyHasRole = member?.roles?.cache?.some((r) =>
        [config.AlexChannelRoleId, "737197256922628157"].includes(r.id)
      );
      if (alreadyHasRole)
        return tools.DMUser(user, "You are already in Alex's channel");

      const introductionMessage =
        "Hi.\nThank you for choosing to enter Alex's mentor room.\nPlease read the following Terms and Conditions.\n Once ready, click on the " +
        "👍" +
        " emoji below.";
      const verificationMessage =
        "By clicking the " +
        "👍" +
        " emoji:\n\n" +
        "- You accept the Terms and Conditions as laid out above.\n" +
        "- You understand your access to Alex's channel can be terminated at any time.\n\n" +
        "Please click on " +
        "👍" +
        " if you agree to the terms above.";

      tools
        .DMUser(user, introductionMessage)
        .then(() => PostTandC(user))
        .then(() => tools.DMUser(user, verificationMessage))
        .then((m) => {
          m.react("👍");
        });
    } else if (message.id == "752690366892867734") {
      // DEV TEST
      const guild = client.guilds?.cache?.get("732102588031565914");
      const member = guild?.members?.cache?.get(user.id);
      const redRole = "737197205286420511";
      // check if user already has role
      const alreadyHasRole = member?.roles?.cache?.some((r) =>
        [config.AlexChannelRoleId, redRole].includes(r.id)
      );
      if (alreadyHasRole)
        return tools.DMUser(user, "You are already in red role channel");

      const welcomeMessage = config.welcomeMessages[
        Math.floor(Math.random() * config.welcomeMessages?.length)
      ].replaceAll("DiscordUser123", user);
      const generalChannel = client.channels?.cache.find(
        (channel) => channel.id == "732102588031565917"
      );
      tools.DMChannel(generalChannel, welcomeMessage);

      // const introductionMessage = 'Hi.\nThank you for choosing to enter Alex\'s mentor room.\nPlease read the following Terms and Conditions.\n Once ready, click on the ' + '👍' + ' emoji below.';

      // const verificationMessage = 'By clicking the ' + '👍' + ' emoji:\n\n' +
      // '- You accept the Terms and Conditions as laid out above.\n'+
      // '- You understand your access to Alex\'s channel can be terminated at any time.\n\n'+
      // 'Please click on ' + '👍' + ' if you agree to the terms above.';
      // tools.DMUser(user, introductionMessage)
      // .then(() => PostTandC(user))
      // .then(() => tools.DMUser(user, verificationMessage))
      // .then(m => {
      //         m.react('👍');
      // });
    } else if (
      message.author?.bot &&
      (message.content?.includes(".com") || message.content?.includes("http"))
    ) {
      let action = 0;
      switch (emoji.name) {
        case "1️⃣":
          action = 1;
          break;
        case "2️⃣":
          action = 2;
          break;
        case "3️⃣":
          action = 3;
          break;
        case "4️⃣":
          action = 4;
          break;
        case "5️⃣":
          action = 5;
          break;
        case "6️⃣":
          action = 6;
          break;
      }

      const clean = message.content?.replace(
        message.content?.slice(0, message.content?.indexOf("http")),
        ""
      );
      const link = clean.slice(
        0,
        Math.min(clean.indexOf(" "), clean.indexOf("\n"))
      );

      const payload = {
        DiscordUserId: user.id,
        DiscordUserName: user.username,
        Link: link,
        Action: action,
      };

      const endpoint = "SocialIntegrationController";
      tools.Log(`calling boox endpoint ${endpoint} with payload ${payload}`);
      tools
        .BooxPostCall(endpoint.toLowerCase(), payload)
        .then((data) => {
          if (data == null || data === undefined) return;

          console.log(JSON.stringify(data));
        })
        .catch((err) => {
          tools.LogError(err);
        });
    } else if (
      message.author?.bot &&
      emoji.name == "🚀" &&
      message.embeds.filter((e) =>
        e.description?.toLowerCase()?.includes("social integration")
      ).length > 0
    ) {
      tools.AttemptToAddUserToSocialArmy(user);
    }
    
    await socialArmy.handleReactionAdd(reaction, user, client);
  }
  catch(e){
    tools.LogError(e);
  }
});

async function PostTandC(user) {
  return tools
    .DMUser(user, config.MentorTandCPart1)
    .then(() => tools.DMUser(user, config.MentorTandCPart2))
    .then(() => tools.DMUser(user, config.MentorTandCPart3))
    .then(() => tools.DMUser(user, config.MentorTandCPart4))
    .then(() => tools.DMUser(user, config.MentorTandCPart5))
    .then(() => tools.DMUser(user, config.MentorTandCPart6))
    .then(() => tools.DMUser(user, config.MentorTandCPart7))
    .then(() => tools.DMUser(user, config.MentorTandCPart8));
}

client.on("messageReactionRemove", async (reaction, user) => {
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (reaction.message.partial) {
      await reaction.message.fetch();
    }
    
    await socialArmy.handleReactionRemove(reaction, user);
  } catch (e) {
    tools.LogError(e);
  }
});

client.on("messageDelete", async (message) => {
  try {
    await socialArmy.handleMessageDelete(message);
  } catch (e) {
    tools.LogError(e);
  }
});

client.on("guildMemberAdd", async (member) => {
  try{
  tools.Log(member.user.username + " joined the server");
  tools.db.sequelize.sync();
  const welcomeMessage =
    `${member} - welcome to the Afterprime Discord. \n\nPlease click this link to verify - https://discord.com/oauth2/authorize?client_id=${config.CLIENT_ID}&redirect_uri=${config.REDIRECT_URI}&response_type=code&scope=identify%20email`;
  const channel = await client.channels?.fetch(config.VerificationChannelId);
  tools.Log(`Sending welcome message in channel for ${member.user.username}`);
  channel.send(welcomeMessage);
  tools.Log('Welcome message sent in channel');
} catch(err){
  tools.LogError(err)
}
});

tools.db.sequelize.sync({ alter: true }).then(() => {
  tools.Log("Database synced (Social Army tables created/updated if needed)");
}).catch(err => {
  tools.LogError("Database sync error: " + err);
});

client
  .login(token)
  .then(() => {
    tools.Log('Logged in..');
    StartDiscordTimer();
  })
  .catch((e) => {
    tools.LogError(e);
  });

// Global error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  tools.LogError(`Uncaught Exception: ${error}`);
  // Optionally, you can restart the bot or exit the process
  process.exit(1); // Uncomment this line to exit the process on uncaught exception
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  tools.LogError(reason);
  // Optionally, you can restart the bot or exit the process
  process.exit(1); // Uncomment this line to exit the process on unhandled rejection
});

function StartDiscordTimer() {
  // UTC
  const now = new Date();

  setTimeout(function () {
    if (now.getUTCHours() == 21 && !postedAlready) {
      PostCompLeaderBoards();
      postedAlready = true;
    } else if (now.getUTCHours() != 21 && postedAlready) {
      postedAlready = false;
    }

    // check each hour to start new competition
    if (now.getUTCHours() != currentHour) {
      currentHour = now.getUTCHours();
      RemoveCompetitionReadOnly("DemoEquityGrowth");
    }

    StartDiscordTimer();
  }, 10000);
}

function RemoveCompetitionReadOnly(comp) {
  const payload = {
    CompetitionName: comp,
    readOnly: 0,
  };

  const endpoint = "UpdateCompetitionReadOnly";
  tools.Log(`calling boox endpoint ${endpoint} with payload ${payload}`);

  tools
    .BooxPostCall(endpoint.toLowerCase(), payload)
    .then(async (data) => {
      const User = await client.users?.fetch(config.AdminUser);
      if (data == null || data === undefined) { 
        tools.Log(`Null data from Boox ${endpoint} Endpoint`);
        return;
      }

      if (!data.success && data.message != "") {
        tools.DMUser(User, "Error updating readonly: " + data.message);
      } else if (data.success) {
        if (data.message != "0") {
          tools.DMUser(
            User,
            "Updated " + comp + " ReadOnly to:" + payload.readOnly
          );
        }
      }
    })
    .catch((err) => {
      tools.LogError(err);
    });
}

async function PostCompLeaderBoards() {
  // Sleep inbetween so nonce changes and HMAC authenticator doesn't see it as a replay request
  const channel = await client.channels?.fetch(config.GlobalPrimeBotChannelId);
  tools.Log(`Sending !CompStatus DemoEquityGrowth ${new Date().toLocaleString("default", { month: "short" })} in bot-channel`);
  channel
    .send(
      "!CompStatus DemoEquityGrowth" +
        new Date().toLocaleString("default", { month: "short" })
    )
    .then(() => tools.Sleep(10000));
  const User = await client.users?.fetch(config.AdminUser);
  tools.DMUser(
    User,
    "Posted Competition Leaderboard"
  );
}

function PostNewYoutubeVideo(messageContent) {
  const link = messageContent.replace(
    messageContent.slice(0, messageContent.indexOf("http")),
    ""
  );

  const payload = {
    Link: link,
  };

  const endpoint = "NewSocialPostController";
  tools.Log(`calling boox endpoint ${endpoint} with payload ${payload}`);
  tools
    .BooxPostCall(endpoint.toLowerCase(), payload)
    .then(async (data) => {
      const User = await client.users?.fetch(config.AdminUser);
      if (data == null) return;
      if (!data.success && data.message != "") {
        tools.DMUser(
          User,
          "Error sending new post " + data.message
        );
      } else if (data.success) {
        const template =
          "<@&" +
          config.sArmyRoleId +
          ">\n" +
          "🔥 New Post Alert 🔥\n\n" +
          "Global Prime just posted a video! Go check it out!" +
          "\n\n" +
          link +
          "\n\nSocial Army registered users only. Please click the emoji's when you have done the following:\n\n" +
          "1️⃣ = 'Liked' this post (10 points)\n" +
          "2️⃣ = Commented this post (15 points)\n" +
          "3️⃣ = Shared this post (20 points)";

        // client.channels.cache.get(config.sArmyChannelId)
        const channel = await client.channels?.fetch("732102588031565917");
        tools.Log("Sending New Post Alert in channel")
        channel.send(template)
        .then((m) => 
          m.react("1️⃣").then(() => m.react("2️⃣")?.then(() => m.react("3️⃣")))
        );
      }
    })
    .catch((err) => tools.LogError(err));
}

module.exports = { client };
