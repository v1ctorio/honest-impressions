import crypto from "crypto";
import { Blocks, Modal } from "slack-block-builder";

var memoryBanned: Array<string> = [];
export type RichText = Array<any>;

export function HashUser(userId: string): string {

    const salt = process.env.SALT!!;

    return crypto.createHash('sha256').update(userId + salt).digest('hex');
}

export function IsUserBanned(userHash: string): boolean {
    //TODO: implement file-based banned list
    return memoryBanned.includes(userHash);
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

export function BanUser(userHash: string): boolean {
    memoryBanned.push(userHash);
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