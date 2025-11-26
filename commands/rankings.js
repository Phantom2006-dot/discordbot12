const socialArmy = require("../js/socialArmy.tools.js");

module.exports = {
  name: "rankings",
  description: "View the monthly Social Army rankings",
  aliases: ["leaderboard", "social-leaderboard", "lb"],
  usage: "",
  args: false,
  allowedRoles: ['Global Prime Team', 'Moderator', 'Ambassadors', 'The Lady Traders', '@everyone', 'blue role', 'Social Army Judge', 'Social Army Elite'],

  async execute(message, args) {
    try {
      const topUsers = await socialArmy.getLeaderboard(message.guild, socialArmy.socialConfig.LEADERBOARD_SIZE);
      
      for (const user of topUsers) {
        try {
          const member = await message.guild.members.fetch(user.discord_id);
          user.discord_username = member.user.username;
        } catch (e) {}
      }
      
      const embed = socialArmy.createRankingsEmbed(topUsers, message.guild);
      await message.channel.send({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error getting rankings:", error);
      await message.reply("An error occurred while fetching the rankings.");
    }
  },
};
