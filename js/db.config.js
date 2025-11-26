const config = require("../config.prod.json");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.GPDBName,
  config.GPDBUser,
  config.GPDBPassword,
  {
    host: "discordbot-db.cy4p0fxerka5.us-east-1.rds.amazonaws.com",
    dialect: "postgres",

    pool: {
      max: 15,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model.js")(sequelize, Sequelize);

module.exports = db;