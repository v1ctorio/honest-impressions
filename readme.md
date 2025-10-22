# Honest impressions

Stateless[^1] slack bot able to send replies anonymously to a thread in a specific channel. 

- Does not require a database.
- Implements replies moderation via a review queue.
- Implements user banning via salted hashes stored in a file or in memory.
- Uses minimal permissions (for example, no event subscriptions are required) and stores minimal data
- Does not show logs by default to prevent accidental identity leaks.



# Environment variables
The bot is configured via environment variables and the CAN change it's behavior. Read the `.env.example` file for reference.\
It loads `.env` vars from the root folder if present.


# Set-up
1. Go to the Slack API page and create a new app. 

1. Select "From a manifest" and paste this manifest. (Manifest for socket mode, you may adjust the settings to use HTTP-mode. It also is supported.)
```yaml
display_information:
  name: mee seeks
features:
  bot_user:
    display_name: mee seeks
    always_online: false
  shortcuts:
    - name: Honest impression
      type: message
      callback_id: reply_impression
      description: ME SEEKS
oauth_config:
  scopes:
    bot:
      - chat:write
      - commands
      - chat:write.public
settings:
  interactivity:
    is_enabled: true
  org_deploy_enabled: false
  socket_mode_enabled: true
  token_rotation_enabled: false
```
1. Clone the repo and install dependencies with `npm install`
1. Create a `.env` file or set environment variables based on the `.env.example`
1. Run `npm run build` to compile the typescript code.
1. Run `npm start` to start the bot.


# Concerns
This bot is designed to minimize data storage. However, purely by being a Slack app, it is NOT fully anonymous. If a bad actor was able to extract both the app's slack credentials and the salt used for hashing, they could potentially deanonymize users. \
If only the salt was compromised, and the attacker had access to the ban list, the attacker could be able to identify banned users.



Or they could just edit the source code and log everything really :P

[^1]: Banned users are stored in a file or in memory, so the bot is not really fully stateless. Unfortunately, Slack doesn't provide datastore for non-workflow Slack apps.