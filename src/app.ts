import Slack, {App, MessageShortcut, SlackShortcutMiddlewareArgs } from "@slack/bolt";
import crypto from "crypto";
import { Blocks, Elements, Modal } from 'slack-block-builder';


const { SLACK_SIGNING_SECRET,SLACK_APP_TOKEN, SLACK_BOT_TOKEN, PORT, SALT, BANNED_LIST_LOCATION, REVIEWERS } = process.env;

const reviewers = REVIEWERS ? REVIEWERS.split(",") : [];

const BuildApp = (): App => {


  const app = new App({
    signingSecret: SLACK_SIGNING_SECRET,
    token: SLACK_BOT_TOKEN,
    appToken: SLACK_APP_TOKEN,
    socketMode: !PORT,
  });




  // Start the app

  app.shortcut("delete_me", async ({ ack, body, say }: SlackShortcutMiddlewareArgs<MessageShortcut>) => {
    ack();
    if (
      [
        "UJYDFQ2QL",
        "UHFEGV147",
        "U01D6FYHLUW",
        "UM4BAKT6U",
        "U0128N09Q8Y",
      ].includes(body.user.id)
    ) {
      await app.client.chat.delete({
        token: SLACK_BOT_TOKEN,
        ts: body.message.ts,
        channel: body.channel.id,
      });
      await app.client.chat.postEphemeral({
        token: SLACK_BOT_TOKEN,
        channel: body.channel.id,
        user: body.user.id,
        text: `doned`,
      });
      return;
    }
    await app.client.chat.postEphemeral({
      token: SLACK_BOT_TOKEN,
      channel: body.channel.id,
      user: body.user.id,
      text: `grrr stop bullying`,
    });
  });
  app.shortcut("reply_impression", async ({ ack, body, say }: SlackShortcutMiddlewareArgs<MessageShortcut>) => {
    await ack();

    console.log(body);

    let modal = Modal()
      .title("Honest impressions reply")
      .callbackId("impression_id")
      .blocks(
        Blocks.Input()
          .label("Your honest impression")
          .element(
            Elements.TextInput().multiline(true).actionId("dreamy_input").placeholder("Honestly I think..."),
          )
      ).submit("Submit")
      .privateMetaData(`${body.message_ts}`);


    await app.client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      trigger_id: body.trigger_id,
      // View payload
      view: modal.buildToObject(),
    });
  });


  return app;
};

export default BuildApp;