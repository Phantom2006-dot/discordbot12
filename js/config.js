const fs = require('fs');
const path = require('path');

const environment = process.env.NODE_ENV || 'DEV';

let configFile;
if (environment === 'PROD') {
    configFile = path.join(__dirname, '../config.prod.json');
} else {
    configFile = path.join(__dirname, '../config.dev.json');
}

const fileConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));

const config = {
    ...fileConfig,
    token: process.env.DISCORD_TOKEN || fileConfig.token,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || fileConfig.slackWebhookUrl,
    GPDBName: process.env.DB_NAME || fileConfig.GPDBName,
    GPDBUser: process.env.DB_USER || fileConfig.GPDBUser,
    GPDBPassword: process.env.DB_PASSWORD || fileConfig.GPDBPassword,
    DEVBooxApiHMACAppId: process.env.DEV_BOOX_API_HMAC_APP_ID || fileConfig.DEVBooxApiHMACAppId,
    DEVBooxApiHMACAppKey: process.env.DEV_BOOX_API_HMAC_APP_KEY || fileConfig.DEVBooxApiHMACAppKey,
    PRODBooxApiHMACAppId: process.env.PROD_BOOX_API_HMAC_APP_ID || fileConfig.PRODBooxApiHMACAppId,
    PRODBooxApiHMACAppKey: process.env.PROD_BOOX_API_HMAC_APP_KEY || fileConfig.PRODBooxApiHMACAppKey,
    CLIENT_ID: process.env.DISCORD_CLIENT_ID || fileConfig.CLIENT_ID,
    CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || fileConfig.CLIENT_SECRET,
    PORT: process.env.PORT || 8000,
};

module.exports = config;
