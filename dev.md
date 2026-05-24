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

## or with docker 
```
docker run --env-file ./.env \
       --name honest-impressions-app \
       -v honest-impressions-data:/usr/src/app/data \
       -d honest-impressions
```
will create a volume for persistent data storage and store by default the banned users in `/usr/src/app/data/banned_users.txt`. No need to set `BANNED_LIST_LOCATION`. 
