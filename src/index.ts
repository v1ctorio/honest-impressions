import 'dotenv/config';


const { SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN, PORT, SALT, BANNED_LIST_LOCATION, REVIEWERS } = process.env;
import BuildApp from './app.js';

async function main() {

    const app = BuildApp();

    if (!BANNED_LIST_LOCATION) {
        console.log("WARN: BANNED_LIST_LOCATION not set, storing banned user list on memory. This will make the banned list reset on every app restart.");
    }
    if (!SALT) {
        console.log("WARN: SALT not set, exiting.");
        process.exit(1);
    }
    if (!PORT) {
        console.log("PORT not set, fallbacking to socket mode");
    }
    
    await app.start(PORT!!);
    console.log(`\nHonest impressions started on ${PORT ? `port ${PORT}` : 'socket mode'}!`);


}

await main();