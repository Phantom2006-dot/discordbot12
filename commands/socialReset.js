const { EmbedBuilder } = require("discord.js");
const socialArmy = require("../js/socialArmy.tools.js");

module.exports = {
  name: "socialreset",
  description: "Reset monthly scores and announce winners (Admin only)",
  aliases: ["social-reset"],
  usage: "",
  args: false,
  allowedRoles: ["Admin", "Moderator", "GP Team"],

  async execute(message, args) {
    const member = message.member || await message.guild.members.fetch(message.author.id);
    
    if (!socialArmy.isAdmin(member) && !socialArmy.isOwner(message.author.id, message.guild)) {
      return message.reply("You don't have permission to reset scores.");
    }
    
    try {
      const topUsers = await socialArmy.resetMonthlyScores();
      
      if (topUsers.length === 0) {
        return message.reply("No scores to announce for this month.");
      }
      
      for (const user of topUsers) {
        try {
          const m = await message.guild.members.fetch(user.discord_id);
          user.discord_username = m.user.username;
        } catch (e) {}
      }
      
      const monthName = socialArmy.socialConfig.getMonthName();
      const medals = ['🥇', '🥈', '🥉'];
      
      let description = "";
      topUsers.slice(0, 3).forEach((user, idx) => {
        description += `${medals[idx]} **${user.discord_username || `User ${user.discord_id}`}** - ${user.points} points\n`;
      });
      
      const embed = new EmbedBuilder()
        .setTitle(`🎉 Social Army Winners - ${monthName}`)
        .setDescription(description)
        .setColor(0xFFD700)
        .setFooter({ text: "Congratulations to all participants!" });
      
      await message.channel.send({ embeds: [embed] });
      await message.reply("Monthly winners have been announced! Scores will reset with the new month.");
      
    } catch (error) {
      console.error("Error resetting scores:", error);
      await message.reply("An error occurred while resetting scores.");
    }
  },
};
