import crypto from "crypto";
const { SALT, BANNED_LIST_LOCATION } = process.env;

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

// custom RichText element because slack-block-builder doesn't have it yet :pf: 
// see https://github.com/raycharius/slack-block-builder/issues/133#issuecomment-2090479474
export function CustomRichText(fields: RichText ): any {
    return {
        build: ()=>({
            type: "rich_text",
            elements: fields
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