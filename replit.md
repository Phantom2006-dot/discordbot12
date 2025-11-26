# Global Prime Discord Bot

## Overview
This is a Discord bot for the Global Prime trading community. It manages user verification, mentor channel access, competitions, and various Discord interactions.

## Architecture
- **Main Entry**: `js/globalprimediscordbot.js`
- **Database**: PostgreSQL (Sequelize ORM)
- **Backend**: Express server for OAuth verification endpoints (port 7000)
- **Bot Framework**: Discord.js v14

## Key Components
1. **Discord Bot**: Handles commands, reactions, and user interactions
2. **Express Server**: Provides `/verification` endpoint for OAuth flow
3. **Commands**: Modular command system in `/commands` directory
4. **Database**: User verification and registration data

## Configuration
- Uses `config.prod.json` by default (hardcoded in imports)
- Environment variables needed:
  - `DISCORD_TOKEN`: Discord bot token
  - `DATABASE_URL`: PostgreSQL connection (optional, can use external DB)
  - Various Discord IDs and API keys in config files

## Recent Changes
- **2024-11-26**: Initial Replit import and setup
  - Created flexible config system using environment variables
  - Set up workflow on port 8000
  - Fixed Slack webhook error handling
  - Configured database to use DATABASE_URL or external AWS RDS

## Important Setup Requirements

### Discord Bot Intents
The bot requires the following **Privileged Gateway Intents** to be enabled in the Discord Developer Portal:
1. **SERVER MEMBERS INTENT** (GuildMembers)
2. **MESSAGE CONTENT INTENT** (MessageContent)
3. **PRESENCE INTENT** (GuildPresences)

To enable these:
1. Go to https://discord.com/developers/applications
2. Select your application
3. Navigate to "Bot" section
4. Scroll down to "Privileged Gateway Intents"
5. Enable all three intents listed above
6. Save changes

## Project Structure
```
/commands       - Discord bot commands
/commandsbak    - Backup/deprecated commands
/js             - Core bot logic and utilities
/logs           - Winston daily rotating logs
/exceptions     - Exception logs
```

## User Preferences
None documented yet.
