const { EmbedBuilder } = require("discord.js");
const socialArmy = require("../js/socialArmy.tools.js");

module.exports = {
  name: "socialconfig",
  description: "View current Social Army bot configuration",
  aliases: ["social-config", "sconfig"],
  usage: "",
  args: false,
  allowedRoles: ['Global Prime Team', 'Moderator', 'Admin', 'Social Army Judge'],

  async execute(message, args) {
    try {
      const config = socialArmy.socialConfig;
      
      const emojiList = Object.entries(config.EMOJI_POINTS)
        .map(([emoji, points]) => `${emoji} = ${points} pts`)
        .join(", ");
      
      const embed = new EmbedBuilder()
        .setTitle("⚙️ Social Army Configuration")
        .setColor(0x9B59B6)
        .addFields(
          { 
            name: "Social Army Channel", 
            value: config.SOCIAL_ARMY_CHANNEL_ID ? `<#${config.SOCIAL_ARMY_CHANNEL_ID}>` : "Not configured", 
            inline: true 
          },
          { 
            name: "Judge Role", 
            value: config.SOCIAL_ARMY_JUDGE_ROLE_NAME, 
            inline: true 
          },
          { 
            name: "Daily Submission Limit", 
            value: config.DAILY_SUBMISSION_LIMIT.toString(), 
            inline: true 
          },
          { 
            name: "Leaderboard Size", 
            value: config.LEADERBOARD_SIZE.toString(), 
            inline: true 
          },
          { 
            name: "Owner-Only Emojis", 
            value: config.OWNER_ONLY_EMOJIS.join(" "), 
            inline: true 
          },
          { 
            name: "Current Month", 
            value: config.getCurrentMonthKey(), 
            inline: true 
          },
          { 
            name: "Emoji Point Values", 
            value: emojiList, 
            inline: false 
          }
        );
      
      await message.channel.send({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error showing config:", error);
      await message.reply("An error occurred while fetching configuration.");
    }
  },
};
