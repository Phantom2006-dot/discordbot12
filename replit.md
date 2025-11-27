# Global Prime Discord Bot

## Overview
This is a Discord bot for the Global Prime/Afterprime trading community. It manages user verification, mentor channel access, competitions, Social Army scoring system, and various Discord interactions.

## Architecture
- **Main Entry**: `js/globalprimediscordbot.js`
- **Database**: PostgreSQL (Sequelize ORM)
- **Backend**: Express server for OAuth verification endpoints (port 8000)
- **Bot Framework**: Discord.js v14

## Key Components
1. **Discord Bot**: Handles commands, reactions, and user interactions
2. **Express Server**: Provides `/verification` endpoint for OAuth flow
3. **Commands**: Modular command system in `/commands` directory
4. **Social Army**: Reaction-based scoring system for community engagement
5. **Database**: User verification and Social Army scoring data

## Configuration

### Required Environment Variables
- `DISCORD_TOKEN`: Discord bot token (required)

### Optional Environment Variables
- `SOCIAL_ARMY_CHANNEL_ID`: Channel ID for Social Army submissions
- `SOCIAL_ARMY_JUDGE_ROLE_NAME`: Role name for judges (default: "Social Army Judge")
- `SOCIAL_ARMY_ELITE_ROLE_NAME`: Role name for elite members (default: "Social Army Elite")
- `ADMIN_ROLE_NAME`: Admin role name (default: "Admin")
- `DAILY_SUBMISSION_LIMIT`: Max daily submissions per user (default: 5)
- `LEADERBOARD_SIZE`: Number of users to show in rankings (default: 10)
- `DATABASE_URL`: PostgreSQL connection string
- `SLACK_WEBHOOK_URL`: For error notifications

### Discord Developer Portal Setup
**IMPORTANT**: Enable these Privileged Gateway Intents in your Discord Developer Portal:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application > Bot section
3. Enable:
   - **Server Members Intent** (required)
   - **Message Content Intent** (required)
4. Save changes

## Social Army Feature

### Slash Commands
- `/submit url:<url> image:<attachment>` - Submit content for judging (provide URL or attach image)
- `/rankings` - View monthly leaderboard
- `/social-stats user:<@user>` - View stats for yourself or another user (optional user parameter)
- `/social-config` - View Social Army configuration (ephemeral, any user)
- `/social-reset` - Reset monthly scores and announce winners (admin only)
- `/social-export limit:<number>` - Export leaderboard data as text file (admin only)

### Emoji Point System
| Category | Emoji | Points |
|----------|-------|--------|
| Effort | ✍️ | 1 |
| Effort | 🎨 | 3 |
| Effort | 🎬 | 5 |
| Effort | 🎞️ | 8 |
| Creativity | 💡 | 2 |
| Creativity | 🤯 | 4 |
| Reach | 📊 | 2 |
| Reach | 🔥 | 4 |
| Reach | 🚀 | 8 |
| Consistency | 🧡 | 2 |
| Consistency | 💪 | 3 |
| Bonus (Owner Only) | 🏅 | 5 |
| Bonus (Owner Only) | 👑 | 10 |

### How It Works
1. Users submit content in the Social Army channel using `!submit` or `/submit`
2. Judges (with "Social Army Judge" role) react with scoring emojis
3. Points are tracked automatically per user per month
4. Monthly leaderboard shows top contributors
5. Each month starts fresh - previous month data is saved but new month gets clean slate

### Automatic Leaderboard Posts
The bot automatically posts the leaderboard to the Social Army channel:
- **Daily**: Once at 00:00 UTC (start of day)
- **Every 4 Hours**: Regular updates throughout the day
- Posts show "Daily Update" or "4-Hour Update" in the footer with timestamp

## Recent Changes
- **2024-11-27**: Added scheduled leaderboard posting (daily + every 4 hours)
- **2024-11-27**: Fixed channel ID comparison for reaction scoring
- **2024-11-27**: Added URL as separate message after submission embed
- **2024-11-27**: Cleaned up unused attached_assets folder
- **2024-11-26**: Added Social Army reaction-based scoring system
- **2024-11-26**: Initial Replit import and setup

## Project Structure
```
/commands           - Discord bot commands
  - submit.js       - Social Army submission command
  - rankings.js     - Leaderboard command
  - socialStats.js  - User stats command
  - socialConfig.js - Config viewer (admin)
  - socialReset.js  - Score reset (admin)
/commandsbak        - Backup/deprecated commands
/js                 - Core bot logic and utilities
  - config.js       - Environment-aware configuration
  - db.config.js    - Database connection
  - tools.js        - Utility functions
  - socialArmy.config.js  - Social Army settings
  - socialArmy.model.js   - Database models
  - socialArmy.tools.js   - Social Army utilities
/logs               - Winston daily rotating logs
/exceptions         - Exception logs
```

## Database Tables
- `users` - Discord user verification data
- `social_scores` - Monthly points per user
- `social_message_scores` - Individual reaction scores
- `social_submissions` - Daily submission tracking

## User Preferences
None documented yet.
