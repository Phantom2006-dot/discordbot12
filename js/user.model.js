module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("users", {
    discord_id: { type: Sequelize.STRING, primaryKey: true},
    name: { type: Sequelize.STRING },
    username: { type: Sequelize.STRING },
    email: { type: Sequelize.STRING },
    discriminator: { type: Sequelize.STRING },
    verified: { type: Sequelize.BOOLEAN },
    verified_at: { type: Sequelize.DATE }
  });

  return User;
};
