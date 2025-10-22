import Slack, { App, BlockButtonAction, MessageShortcut, SlackShortcutMiddlewareArgs, webApi } from "@slack/bolt";
import { Actions, Blocks, Button, Context, Divider, Message, Modal } from 'slack-block-builder';
import { BanUser, CustomRichText, GenerateErrorModal, HashUser, IsUserBanned, RichText, RichTextInput } from "./utils.js";


const { SLACK_SIGNING_SECRET, SLACK_APP_TOKEN, SLACK_BOT_TOKEN, PORT, SALT, BANNED_LIST_LOCATION, REVIEWERS, REVIEW_CHANNEL_ID, IMPRESSIONS_CHANNEL_ID } = process.env;

const reviewers = REVIEWERS ? REVIEWERS.split(",") : [];

const BuildApp = (): App => {


  const app = new App({
    signingSecret: SLACK_SIGNING_SECRET,
    token: SLACK_BOT_TOKEN,
    appToken: SLACK_APP_TOKEN,
    socketMode: !PORT,
  });





  app.shortcut("reply_impression", async ({ ack, body, say }: SlackShortcutMiddlewareArgs<MessageShortcut>) => {
    await ack();

    const hUser = HashUser(body.user.id);


    if (body.channel.id !== IMPRESSIONS_CHANNEL_ID) {

      await app.client.views.open({
        trigger_id: body.trigger_id,
        view: GenerateErrorModal("Anonymous impressions are only seeked in the honest impressions channel!")
      });

      return;
    }

    if (IsUserBanned(hUser)) {
      await app.client.views.open({
        trigger_id: body.trigger_id,
        view: GenerateErrorModal("You are banned from submitting honest impressions.")
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
      .privateMetaData(`${body.message.ts}`);


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


    const ok = await sendImpressionToReview(impression, view.private_metadata, hUser, client);

    if (!ok) {
      client.chat.postEphemeral({
        channel: IMPRESSIONS_CHANNEL_ID!!,
        user: body.user.id,
        text: "There was an error submitting your honest impression for review. Please try again later. Ask a maintainer to check if the app is in the review channel.",
      }).catch(_=>_);
      return;
    } else {
      client.chat.postEphemeral({
        channel: IMPRESSIONS_CHANNEL_ID!!,
        user: body.user.id,
        text: "Your honest impression has been submitted for review. Thank you!",
      }).catch(_=>_);
    }
  });


  app.action<BlockButtonAction>("approve_impression", async ({ ack, body, action, client }) => {
    await ack();

    const fields = (body as any).message.blocks[2].elements[0].elements as RichText;

    let updatedMessage = JSON.parse(JSON.stringify((body as any).message.blocks));
    // sorry but i have to do raw block kit for this one :noo:
    updatedMessage[5] = {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": `:white_check_mark: This impression has been approved by <@${body.user.id}>.`
        }
      ]
    }
    try {

    await client.chat.update({
      channel: REVIEW_CHANNEL_ID!,
      ts: body.message!.ts,
      blocks: updatedMessage

    })

    await client.chat.postMessage(
      Message()
        .channel(IMPRESSIONS_CHANNEL_ID!)
        .threadTs(action.value)
        .text("Surely an honest impression")
        .blocks(
          CustomRichText(fields)
        )
        .buildToObject()
    )
  } catch(e){
      client.chat.postEphemeral({
        channel: (body as any).channel.id,
        user: body.user.id,
        text: "There was an error approving the impression. Please try again later."
      }).catch(_=>_)
    }
  });

  app.action<BlockButtonAction>("delete_impression", async ({ ack, body, client }) => {
    await ack();
    try {
      await client.chat.delete({
        channel: REVIEW_CHANNEL_ID!,
        ts: body.message!.ts,
      });
    } catch (e) {
      client.chat.postEphemeral({
        channel: REVIEW_CHANNEL_ID!,
        user: body.user.id,
        text: "There was an error deleting the impression. Please try again later."
      }).catch(_=>_)
    }
  });


    app.action<BlockButtonAction>("ban_user", async ({ ack, body, action, client }) => {
    await ack();

    const fields = (body as any).message.blocks[2].elements[0].elements as RichText;

    let updatedMessage = JSON.parse(JSON.stringify((body as any).message.blocks));
    
    // it feels so wrong doing taw block kit
    updatedMessage[5] = {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": `:white_check_mark: This honest impression poster has been banned by <@${body.user.id}>.`
        }
      ]
    }
    updatedMessage[6] = {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Delete"
          },
          "action_id": "delete_impression"
        }
      ]
    }

    try {

      if (!action.value) throw new Error("No user hash provided to ban user.");

      const ok = await BanUser(action.value)
      if (!ok) throw new Error("Could not ban user.");

    await client.chat.update({
      channel: REVIEW_CHANNEL_ID!,
      ts: body.message!.ts,
      blocks: updatedMessage

    })

  } catch(e){
      client.chat.postEphemeral({
        channel: (body as any).channel.id,
        user: body.user.id,
        text: "There was an error banning the user. Please try again later or tell a maintainer to investigate."
      }).catch(_=>_)
    }
  });


  app.view("view_auto_ok", async ({ ack }) => {
    await ack();
  });
  return app;
};



async function sendImpressionToReview(impression: RichText, parentTs: string, hashedUser: string, client: webApi.WebClient): Promise<boolean> {

  let thread_permalink = "";
  try {

    thread_permalink = (await client.chat.getPermalink({
      channel: IMPRESSIONS_CHANNEL_ID!!,
      message_ts: parentTs
    })).permalink!!;

  } catch (e) {
    return false;
  }

  let reviewMessage = Message()
    .channel(REVIEW_CHANNEL_ID)
    
    .text("New honest impression to review, open in the slack app to review.")
    .blocks(
      Blocks.Section().text(`New honest impression to review. `),
      Divider(),
      CustomRichText(impression),
      Divider(),
      Context().elements(
        `See parent message: <${thread_permalink}|here>`,
      ),
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

  try {
    //TODO: I actually have no idea on how to disable the message preview but maybe it's useful so I'll leave it for now
    await client.chat.postMessage({ ...reviewMessage.buildToObject(), unfurl_links: true, unfurl_media: true});
    return true;
  } catch (error) {
    return false;
  }

}
export default BuildApp;