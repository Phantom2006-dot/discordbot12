const { EmbedBuilder } = require("discord.js");
const db = require("./db.config.js");
const socialConfig = require("./socialArmy.config.js");

const SocialScore = db.SocialScore;
const SocialMessageScore = db.SocialMessageScore;
const SocialSubmission = db.SocialSubmission;

function isJudge(member) {
  if (!member || !member.roles) return false;
  return member.roles.cache.some(role => role.name === socialConfig.SOCIAL_ARMY_JUDGE_ROLE_NAME);
}

function isAdmin(member) {
  if (!member || !member.roles) return false;
  return member.roles.cache.some(role => role.name === socialConfig.ADMIN_ROLE_NAME);
}

function isOwner(userId, guild) {
  return guild.ownerId === userId;
}

async function checkDailySubmissionLimit(discordId) {
  const dateKey = socialConfig.getCurrentDateKey();
  try {
    const count = await SocialSubmission.count({
      where: {
        discord_id: discordId,
        date_key: dateKey
      }
    });
    return {
      canSubmit: count < socialConfig.DAILY_SUBMISSION_LIMIT,
      currentCount: count
    };
  } catch (error) {
    console.error("Error checking submission limit:", error);
    return { canSubmit: true, currentCount: 0 };
  }
}

function validateSubmissionContent(content, attachments) {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = content.match(urlPattern);
  
  if (urls && urls.length > 0) {
    return { isValid: true, url: urls[0] };
  } else if (attachments && attachments.size > 0) {
    return { isValid: true, url: attachments.first().url };
  }
  return { isValid: false, url: "" };
}

async function handleReactionAdd(reaction, user, client) {
  try {
    if (user.bot) return;
    
    if (!socialConfig.SOCIAL_ARMY_CHANNEL_ID || 
        reaction.message.channel.id !== socialConfig.SOCIAL_ARMY_CHANNEL_ID) {
      return;
    }
    
    const emojiStr = reaction.emoji.name;
    
    if (!socialConfig.EMOJI_POINTS[emojiStr]) {
      return;
    }
    
    const member = reaction.message.guild?.members.cache.get(user.id) ||
                   await reaction.message.guild?.members.fetch(user.id).catch(() => null);
    
    if (!member) return;
    
    if (!isJudge(member)) {
      await reaction.users.remove(user.id).catch(() => {});
      console.log(`Removed unauthorized reaction ${emojiStr} from ${user.username} (not a judge)`);
      return;
    }
    
    if (socialConfig.OWNER_ONLY_EMOJIS.includes(emojiStr) && 
        !isOwner(user.id, reaction.message.guild)) {
      await reaction.users.remove(user.id).catch(() => {});
      console.log(`Removed owner-only reaction ${emojiStr} from ${user.username}`);
      return;
    }
    
    let authorId;
    const submission = await SocialSubmission.findOne({
      where: { message_id: reaction.message.id.toString() }
    });
    
    if (submission) {
      authorId = submission.discord_id;
    } else if (!reaction.message.author.bot) {
      authorId = reaction.message.author.id;
    } else {
      return;
    }
    
    const points = socialConfig.EMOJI_POINTS[emojiStr];
    const monthKey = socialConfig.getCurrentMonthKey();
    const judgeId = user.id;
    const messageId = reaction.message.id.toString();
    
    const existingScore = await SocialMessageScore.findOne({
      where: {
        message_id: messageId,
        judge_id: judgeId,
        emoji: emojiStr
      }
    });
    
    if (existingScore) return;
    
    await SocialMessageScore.create({
      message_id: messageId,
      author_id: authorId,
      judge_id: judgeId,
      emoji: emojiStr,
      points: points,
      month_key: monthKey
    });
    
    let userScore = await SocialScore.findOne({
      where: {
        discord_id: authorId,
        month_key: monthKey
      }
    });
    
    if (!userScore) {
      let username = `User ${authorId}`;
      try {
        const submissionAuthor = await reaction.message.guild.members.fetch(authorId);
        username = submissionAuthor.user.username;
      } catch (e) {}
      
      await SocialScore.create({
        discord_id: authorId,
        discord_username: username,
        month_key: monthKey,
        points: points
      });
    } else {
      await userScore.update({ points: userScore.points + points });
    }
    
    console.log(`Added ${points} points to user ${authorId} for ${emojiStr} from ${user.username}`);
    
  } catch (error) {
    console.error("Error adding reaction score:", error);
  }
}

async function handleReactionRemove(reaction, user) {
  try {
    if (user.bot) return;
    
    if (!socialConfig.SOCIAL_ARMY_CHANNEL_ID || 
        reaction.message.channel.id !== socialConfig.SOCIAL_ARMY_CHANNEL_ID) {
      return;
    }
    
    const emojiStr = reaction.emoji.name;
    
    if (!socialConfig.EMOJI_POINTS[emojiStr]) {
      return;
    }
    
    const judgeId = user.id;
    const messageId = reaction.message.id.toString();
    
    let authorId;
    const submission = await SocialSubmission.findOne({
      where: { message_id: messageId }
    });
    
    if (submission) {
      authorId = submission.discord_id;
    } else if (!reaction.message.author.bot) {
      authorId = reaction.message.author.id;
    } else {
      return;
    }
    
    const messageScore = await SocialMessageScore.findOne({
      where: {
        message_id: messageId,
        judge_id: judgeId,
        emoji: emojiStr
      }
    });
    
    if (messageScore) {
      const points = messageScore.points;
      const scoreMonthKey = messageScore.month_key;
      
      const userScore = await SocialScore.findOne({
        where: {
          discord_id: authorId,
          month_key: scoreMonthKey
        }
      });
      
      if (userScore) {
        await userScore.update({ points: userScore.points - points });
      }
      
      await messageScore.destroy();
      console.log(`Removed ${points} points from user ${authorId} for ${emojiStr} by ${user.username}`);
    }
    
  } catch (error) {
    console.error("Error removing reaction score:", error);
  }
}

async function handleMessageDelete(message) {
  try {
    if (!socialConfig.SOCIAL_ARMY_CHANNEL_ID || 
        message.channel.id !== socialConfig.SOCIAL_ARMY_CHANNEL_ID) {
      return;
    }
    
    const messageId = message.id.toString();
    
    const submission = await SocialSubmission.findOne({
      where: { message_id: messageId }
    });
    
    let authorId;
    if (submission) {
      authorId = submission.discord_id;
    } else if (message.author && !message.author.bot) {
      authorId = message.author.id;
    } else {
      return;
    }
    
    const messageScores = await SocialMessageScore.findAll({
      where: { message_id: messageId }
    });
    
    if (!messageScores || messageScores.length === 0) {
      if (submission) {
        await submission.destroy();
        console.log(`Removed submission record for deleted message ${messageId}`);
      }
      return;
    }
    
    const pointsByMonth = {};
    for (const score of messageScores) {
      pointsByMonth[score.month_key] = (pointsByMonth[score.month_key] || 0) + score.points;
    }
    
    for (const [monthKey, totalPoints] of Object.entries(pointsByMonth)) {
      const userScore = await SocialScore.findOne({
        where: {
          discord_id: authorId,
          month_key: monthKey
        }
      });
      
      if (userScore) {
        await userScore.update({ points: userScore.points - totalPoints });
      }
    }
    
    for (const score of messageScores) {
      await score.destroy();
    }
    
    if (submission) {
      await submission.destroy();
    }
    
    console.log(`Removed points from user ${authorId} across ${Object.keys(pointsByMonth).length} month(s) due to message deletion`);
    
  } catch (error) {
    console.error("Error handling message deletion:", error);
  }
}

async function getLeaderboard(guild, limit = 10) {
  const monthKey = socialConfig.getCurrentMonthKey();
  
  const topUsers = await SocialScore.findAll({
    where: { month_key: monthKey },
    order: [['points', 'DESC']],
    limit: limit
  });
  
  return topUsers;
}

async function getUserStats(discordId, guild) {
  const monthKey = socialConfig.getCurrentMonthKey();
  
  const userScore = await SocialScore.findOne({
    where: {
      discord_id: discordId,
      month_key: monthKey
    }
  });
  
  const totalScores = await SocialScore.count({
    where: { month_key: monthKey }
  });
  
  let rank = null;
  if (userScore) {
    const higherCount = await SocialScore.count({
      where: {
        month_key: monthKey,
        points: { [db.Sequelize.Op.gt]: userScore.points }
      }
    });
    rank = higherCount + 1;
  }
  
  const messageScores = await SocialMessageScore.findAll({
    where: {
      author_id: discordId,
      month_key: monthKey
    }
  });
  
  const emojiBreakdown = {};
  for (const score of messageScores) {
    emojiBreakdown[score.emoji] = (emojiBreakdown[score.emoji] || 0) + score.points;
  }
  
  return {
    points: userScore?.points || 0,
    rank: rank,
    totalParticipants: totalScores,
    reactionsReceived: messageScores.length,
    emojiBreakdown: emojiBreakdown
  };
}

async function createSubmission(discordId, messageId, submissionUrl) {
  const dateKey = socialConfig.getCurrentDateKey();
  
  await SocialSubmission.create({
    discord_id: discordId,
    date_key: dateKey,
    message_id: messageId.toString(),
    submission_url: submissionUrl
  });
}

async function resetMonthlyScores() {
  const monthKey = socialConfig.getCurrentMonthKey();
  
  const topUsers = await SocialScore.findAll({
    where: { month_key: monthKey },
    order: [['points', 'DESC']],
    limit: 10
  });
  
  return topUsers;
}

function createRankingsEmbed(topUsers, guild) {
  const monthName = socialConfig.getMonthName();
  const medals = ['🥇', '🥈', '🥉'];
  
  const embed = new EmbedBuilder()
    .setTitle(`🏆 Social Army Rankings - ${monthName}`)
    .setDescription("Top contributors this month:")
    .setColor(0xFFD700);
  
  let description = "";
  topUsers.forEach((user, idx) => {
    const medal = idx < 3 ? medals[idx] : `#${idx + 1}`;
    const username = user.discord_username || `User ${user.discord_id}`;
    description += `${medal} **${username}** - ${user.points} points\n`;
  });
  
  if (description) {
    embed.setDescription(description);
  } else {
    embed.setDescription("No scores yet this month! Start posting in the Social Army channel!");
  }
  
  return embed;
}

function createStatsEmbed(user, stats) {
  const monthName = socialConfig.getMonthName();
  
  const embed = new EmbedBuilder()
    .setTitle(`📊 Stats for ${user.displayName || user.username}`)
    .setDescription(`Month: ${monthName}`)
    .setColor(0x3498DB)
    .addFields(
      { name: "Total Points", value: `**${stats.points}**`, inline: true },
      { name: "Rank", value: stats.rank ? `**#${stats.rank}**` : "Not ranked", inline: true },
      { name: "Reactions Received", value: `**${stats.reactionsReceived}**`, inline: true }
    );
  
  if (stats.emojiBreakdown && Object.keys(stats.emojiBreakdown).length > 0) {
    const sortedEmojis = Object.entries(stats.emojiBreakdown)
      .sort((a, b) => b[1] - a[1]);
    const breakdownText = sortedEmojis
      .map(([emoji, pts]) => `${emoji}: ${pts} pts`)
      .join('\n');
    embed.addFields({ name: "Points by Category", value: breakdownText, inline: false });
  }
  
  return embed;
}

function createSubmissionEmbed(user, submissionUrl, currentCount, hasImage, imageUrl) {
  const embed = new EmbedBuilder()
    .setTitle("📝 Social Army Submission")
    .setDescription(`Submitted by ${user}`)
    .setColor(0x3498DB)
    .addFields({ name: "Content", value: submissionUrl, inline: false })
    .setFooter({ text: `Submission ${currentCount + 1}/${socialConfig.DAILY_SUBMISSION_LIMIT} today` })
    .setTimestamp();
  
  if (hasImage && imageUrl) {
    embed.setImage(imageUrl);
  }
  
  return embed;
}

module.exports = {
  isJudge,
  isAdmin,
  isOwner,
  checkDailySubmissionLimit,
  validateSubmissionContent,
  handleReactionAdd,
  handleReactionRemove,
  handleMessageDelete,
  getLeaderboard,
  getUserStats,
  createSubmission,
  resetMonthlyScores,
  createRankingsEmbed,
  createStatsEmbed,
  createSubmissionEmbed,
  socialConfig
};
