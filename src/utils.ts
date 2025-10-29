import crypto from "node:crypto";
import { Blocks, Modal } from "slack-block-builder";

import fs from "fs/promises";

var banned: Array<string> = [];
export type RichText = Array<any>;

const BANNED_LIST_LOCATION = process.env.BANNED_LIST_LOCATION || "";


export function HashUser(userId: string): string {

    const salt = process.env.SALT!!;

    return crypto.createHash('sha256').update(userId + salt).digest('hex');
}

export async function InitBannedList() {
  if (!BANNED_LIST_LOCATION) return; 
  try {
    const raw = await fs.readFile(BANNED_LIST_LOCATION, "utf8");
    banned = raw.split(/\r?\n/).filter(Boolean);
  } catch {
    await fs.writeFile(BANNED_LIST_LOCATION, "", { mode: 0o600 });
    banned = [];
  }
}

export function IsUserBanned(userHash: string): boolean {
    return banned.includes(userHash);
}

export function GenerateErrorModal(error:string){
    return Modal().title("Error!")
        .blocks(
          Blocks.Section().text(error)
        )
        .submit("Ok")
        .callbackId("view_auto_ok")
        .buildToObject();
}

export async function BanUser(userHash: string): Promise<boolean> {
  if (banned.includes(userHash)) return false;
  banned.push(userHash);
  if (BANNED_LIST_LOCATION) await fs.appendFile(BANNED_LIST_LOCATION, userHash + "\n");
  return true;
}


// custom RichText element because slack-block-builder doesn't have it yet :pf: 
// see https://github.com/raycharius/slack-block-builder/issues/133#issuecomment-2090479474
export function CustomRichText(fields: RichText ): any {
    return {
        build: ()=>({
            type: "rich_text",
            elements: [
                {
                    type: "rich_text_section",
                    elements: fields
                }
            ]
        })
    }
}

export function RichTextInput(actionId: string, focusOnLoad: boolean = false): any {
    return {
        build: ()=>({
            type: "rich_text_input",
            action_id: actionId,
            focus_on_load: focusOnLoad
        })
    }
}