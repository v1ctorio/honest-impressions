

const { SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN, SLACK_APP_TOKEN, SALT, BANNED_LIST_LOCATION, REVIEWERS } = process.env;
import BuildApp from './app.js';
import { App, ExpressReceiver } from '@slack/bolt';
import { httpServerHandler } from 'cloudflare:node';

async function main() {

    const receiver = new ExpressReceiver({
        signingSecret: SLACK_SIGNING_SECRET!!,
    })
    const app = BuildApp(new App({
        receiver,
        token: SLACK_BOT_TOKEN,
        appToken: SLACK_APP_TOKEN
    }));
    
    const PORT = 3000
    
    await app.start(PORT!!);

    console.log(`Loaded env vars. IMPRESSIONS_CHANNEL_ID=${process.env.IMPRESSIONS_CHANNEL_ID}, REVIEW_CHANNEL_ID=${process.env.REVIEW_CHANNEL_ID}`);

    console.log(`\nHonest impressions started on ${PORT ? `port ${PORT}` : 'socket mode'}!`);


}

await main();

export default httpServerHandler({ port: 3000 })