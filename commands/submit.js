const socialArmy = require("../js/socialArmy.tools.js");

module.exports = {
  name: "submit",
  description: "Submit your content to Social Army for judging",
  aliases: ["sub"],
  usage: "<url or attach an image>",
  args: false,
  dmOnly: false,
  allowedRoles: ['Global Prime Team', 'Moderator', 'Ambassadors', 'The Lady Traders', '@everyone', 'blue role', 'Social Army Judge', 'Social Army Elite'],

  async execute(message, args) {
    const discordId = message.author.id;
    
    if (socialArmy.socialConfig.SOCIAL_ARMY_CHANNEL_ID && 
        message.channel.id !== socialArmy.socialConfig.SOCIAL_ARMY_CHANNEL_ID) {
      const channelId = socialArmy.socialConfig.SOCIAL_ARMY_CHANNEL_ID;
      try {
        await message.reply(`Please use the submit command in <#${channelId}>`);
      } catch (e) {}
      return;
    }
    
    const { canSubmit, currentCount } = await socialArmy.checkDailySubmissionLimit(discordId);
    if (!canSubmit) {
      return message.reply(`You've reached your daily submission limit (${socialArmy.socialConfig.DAILY_SUBMISSION_LIMIT} submissions per day). Try again tomorrow!`);
    }
    
    const content = args.join(" ");
    const { isValid, url } = socialArmy.validateSubmissionContent(content, message.attachments);
    
    if (!isValid) {
      return message.reply("Please provide either a URL or attach an image with your submission.\nUsage: `!submit <url>` or attach an image");
    }
    
    const hasImage = message.attachments.size > 0 && 
                     message.attachments.first().contentType?.startsWith('image/');
    const imageUrl = hasImage ? message.attachments.first().url : null;
    
    const embed = socialArmy.createSubmissionEmbed(
      message.author,
      url,
      currentCount,
      hasImage,
      imageUrl
    );
    
    const submissionMessage = await message.channel.send({ embeds: [embed] });
    
    for (const emoji of Object.keys(socialArmy.socialConfig.EMOJI_POINTS)) {
      try {
        await submissionMessage.react(emoji);
      } catch (e) {
        console.log(`Failed to add emoji ${emoji}:`, e.message);
      }
    }
    
    await socialArmy.createSubmission(discordId, submissionMessage.id, url);
    console.log(`Submission created for ${message.author.username} - Message ID: ${submissionMessage.id}`);
    
    try {
      await message.delete().catch(() => {});
    } catch (e) {}
  },
};
