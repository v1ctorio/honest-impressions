import crypto from "crypto";
const { SALT, BANNED_LIST_LOCATION } = process.env;

var memoryBanned: Array<string> = [];


export function HashUser(userId: string, salt: string): string {
    return crypto.createHash('sha256').update(userId + salt).digest('hex');
}

export function IsUserBanned(userHash: string): boolean {
    //TODO: implement file-based banned list
    return memoryBanned.includes(userHash);
}