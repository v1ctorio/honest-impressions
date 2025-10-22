import Slack, { App, MessageShortcut, SlackActionMiddlewareArgs, SlackShortcutMiddlewareArgs, webApi } from "@slack/bolt";
import crypto from "crypto";
import { Actions, Blocks, Button, Divider, Elements, Message, Modal } from 'slack-block-builder';
import { CustomRichText, HashUser, RichText, RichTextInput } from "./utils.js";


const { SLACK_SIGNING_SECRET, SLACK_APP_TOKEN, SLACK_BOT_TOKEN, PORT, SALT, BANNED_LIST_LOCATION, REVIEWERS, REVIEW_CHANNEL_ID, IMPRESSIONS_CHANNEL_ID } = process.env;

const reviewers = REVIEWERS ? REVIEWERS.split(",") : [];

const BuildApp = (): App => {


  const app = new App({
    signingSecret: SLACK_SIGNING_SECRET,
    token: SLACK_BOT_TOKEN,
    appToken: SLACK_APP_TOKEN,
    socketMode: !PORT,
  });




  // Start the app

  app.shortcut("delete_me", async ({ ack, body, say, }: SlackShortcutMiddlewareArgs<MessageShortcut>) => {
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


    if (body.channel.id !== IMPRESSIONS_CHANNEL_ID) {
      const errorModal = Modal().title("Error!")
        .blocks(
          Blocks.Section().text("Anonymous impressions are only seeked in the honest impressions channel!")
        )
        .submit("Ok")
        .callbackId("view_auto_ok")
        .buildToObject();



      await app.client.views.open({
        trigger_id: body.trigger_id,
        view: errorModal
      });
      return;
    }


    let modal = Modal()
      .title("Honest impressions reply")
      .callbackId("impression_id")
      .blocks(
        Blocks.Input()
          .label("Your honest impression")
          .element(
            RichTextInput("dreamy_input", true)
          )
          .blockId("dreamy_input_block")
      ).submit("Submit")
      .privateMetaData(`${body.message_ts}`);


    await app.client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      trigger_id: body.trigger_id,
      // View payload
      view: modal.buildToObject(),
    });
  });

  app.view("impression_id", async ({ ack, body, view, client }) => {
    await ack();

    const hUser = HashUser(body.user.id);
    const impression_block = view.state.values["dreamy_input_block"]["dreamy_input"] as any;
    // Sorry for TS. block kit is annoying
    const impression = impression_block["rich_text_value"]["elements"][0]["elements"] as RichText;

    console.log(body, view);

    console.log(impression, hUser);

  });


  app.view("view_auto_ok", async ({ ack }) => {
    await ack();
  });
  return app;
};



function sendImpressionToReview(impression: RichText, parentTs: string, hashedUser: string, client: webApi.WebClient) {
  let reviewMessage = Message()
    .channel(REVIEW_CHANNEL_ID)
    .text("New honest impression to review, open in the slack app to review.")
    .blocks(
      Blocks.Section().text(`New honest impression to review. `),
      Divider(),
      CustomRichText(impression),
      Divider(),
      Actions()
        .elements(
          Button()
            .text("Approve")
            .primary()
            .actionId("approve_impression")
            .value(parentTs),
          Button()
            .text("Delete")
            .actionId("delete_impression"),
          Button()
            .text("Ban user")
            .danger()
            .actionId("ban_user")
            .value(hashedUser),
        ),
    );
    
}
export default BuildApp;