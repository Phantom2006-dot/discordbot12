module.exports = (sequelize, Sequelize) => {
  const SocialScore = sequelize.define("social_scores", {
    id: { 
      type: Sequelize.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    discord_id: { 
      type: Sequelize.STRING(50), 
      allowNull: false 
    },
    discord_username: { 
      type: Sequelize.STRING(100) 
    },
    month_key: { 
      type: Sequelize.STRING(7), 
      allowNull: false 
    },
    points: { 
      type: Sequelize.INTEGER, 
      defaultValue: 0 
    }
  }, {
    indexes: [
      { fields: ['discord_id'] },
      { fields: ['month_key'] },
      { fields: ['discord_id', 'month_key'], unique: true }
    ]
  });

  const SocialMessageScore = sequelize.define("social_message_scores", {
    id: { 
      type: Sequelize.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    message_id: { 
      type: Sequelize.STRING(50), 
      allowNull: false 
    },
    author_id: { 
      type: Sequelize.STRING(50), 
      allowNull: false 
    },
    judge_id: { 
      type: Sequelize.STRING(50), 
      allowNull: false 
    },
    emoji: { 
      type: Sequelize.STRING(50), 
      allowNull: false 
    },
    points: { 
      type: Sequelize.INTEGER, 
      allowNull: false 
    },
    month_key: { 
      type: Sequelize.STRING(7), 
      allowNull: false 
    }
  }, {
    indexes: [
      { fields: ['message_id'] },
      { fields: ['author_id'] },
      { fields: ['month_key'] },
      { fields: ['message_id', 'judge_id', 'emoji'], unique: true }
    ]
  });

  const SocialSubmission = sequelize.define("social_submissions", {
    id: { 
      type: Sequelize.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    discord_id: { 
      type: Sequelize.STRING(50), 
      allowNull: false 
    },
    date_key: { 
      type: Sequelize.STRING(10), 
      allowNull: false 
    },
    message_id: { 
      type: Sequelize.STRING(50), 
      allowNull: false 
    },
    submission_url: { 
      type: Sequelize.STRING(500) 
    }
  }, {
    indexes: [
      { fields: ['discord_id'] },
      { fields: ['date_key'] },
      { fields: ['discord_id', 'date_key'] },
      { fields: ['message_id'] }
    ]
  });

  return { SocialScore, SocialMessageScore, SocialSubmission };
};
