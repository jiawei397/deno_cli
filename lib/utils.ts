export function isFileExist(path: string) {
    try {
        Deno.statSync(path);
        return true;
    } catch {
        return false;
    }
}
