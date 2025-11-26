const config = require("./config.js");
const Sequelize = require("sequelize");

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 15,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  });
} else {
  sequelize = new Sequelize(
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
      },
      logging: false
    }
  );
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model.js")(sequelize, Sequelize);

module.exports = db;