const socialArmy = require("../js/socialArmy.tools.js");

module.exports = {
  name: "socialstats",
  description: "View Social Army statistics for yourself or another user",
  aliases: ["social-stats", "mystats", "sstats"],
  usage: "[@user]",
  args: false,
  allowedRoles: ['Global Prime Team', 'Moderator', 'Ambassadors', 'The Lady Traders', '@everyone', 'blue role', 'Social Army Judge', 'Social Army Elite'],

  async execute(message, args) {
    try {
      let targetUser = message.author;
      
      if (message.mentions.users.size > 0) {
        targetUser = message.mentions.users.first();
      }
      
      const stats = await socialArmy.getUserStats(targetUser.id, message.guild);
      const embed = socialArmy.createStatsEmbed(targetUser, stats);
      
      await message.channel.send({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error getting stats:", error);
      await message.reply("An error occurred while fetching statistics.");
    }
  },
};
