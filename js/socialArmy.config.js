module.exports = {
  SOCIAL_ARMY_CHANNEL_ID: process.env.SOCIAL_ARMY_CHANNEL_ID || "",
  SOCIAL_ARMY_JUDGE_ROLE_NAME: process.env.SOCIAL_ARMY_JUDGE_ROLE_NAME || "Social Army Judge",
  SOCIAL_ARMY_ELITE_ROLE_NAME: process.env.SOCIAL_ARMY_ELITE_ROLE_NAME || "Social Army Elite",
  ADMIN_ROLE_NAME: process.env.ADMIN_ROLE_NAME || "Admin",
  LEADERBOARD_SIZE: parseInt(process.env.LEADERBOARD_SIZE || "10"),
  DAILY_SUBMISSION_LIMIT: parseInt(process.env.DAILY_SUBMISSION_LIMIT || "5"),
  
  EMOJI_POINTS: {
    '✍️': 1,
    '🎨': 3,
    '🎬': 5,
    '🎞️': 8,
    '💡': 2,
    '🤯': 4,
    '📊': 2,
    '🔥': 4,
    '🚀': 8,
    '🧡': 2,
    '💪': 3,
    '🏅': 5,
    '👑': 10
  },
  
  OWNER_ONLY_EMOJIS: ['🏅', '👑'],

  getCurrentMonthKey: function() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  getCurrentDateKey: function() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getMonthName: function() {
    const now = new Date();
    return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
};
