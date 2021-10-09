// deno_tag patch 'feat: xxx'

import { runTask } from "../lib/task.ts";

// deno_tag patch
export const versionPath = 'scripts.json';
const actions = ['patch', 'minor', 'major'];

// console.log(Deno.args);
const argLen = Deno.args.length;
if (argLen === 0) {
    Deno.exit(1);
}

interface Package {
    version: string;
    [K: string]: any;
}

async function getPkg() {
    const pkg = await Deno.readTextFile(versionPath);
    const pkgMap: Package = JSON.parse(pkg);
    if (pkgMap.version) {
        if (!/^\d{1}\.\d{1}\.\d{1}$/.test(pkgMap.version)) {
            console.error(`version [${pkgMap.version}] in [${versionPath}] is invalid`);
            Deno.exit(1);
        }
    } else {
        pkgMap.version = '0.0.0';
    }
    return pkgMap;
}

function formatVersion(pkg: Package) {
    let versionAction: string;

    if (argLen === 1) { // 没有传递参数
        versionAction = actions[0];
    } else {
        versionAction = Deno.args[1];
    }
    let version = versionAction;

    if (actions.includes(versionAction)) { // 意味着要变更版本
        const oldversionAction = pkg.version;

        const arr = oldversionAction.split('.');
        let changedIndex = 0;
        if (versionAction === 'patch') {
            changedIndex = 2;
        } else if (versionAction === 'minor') {
            changedIndex = 1;
            arr[2] = '0';
        } else {
            arr[2] = arr[1] = '0';
        }
        if (changedIndex !== -1) {
            arr[changedIndex] = (Number(arr[changedIndex]) + 1) + '';
        }
        version = arr.join('.');
    }

    return version;
}

function writeJson(version: string, pkg: Package) {
    const { version: _, ...others } = pkg;
    console.log(`version will be changed to ${version}`);
    Deno.writeTextFileSync(versionPath, JSON.stringify({
        version,
        ...others
    }, null, 2));
}

export async function changeVersion() {
    const pkg = await getPkg();
    const version = formatVersion(pkg);
    writeJson(version, pkg);
    await runTask(`git add ${versionPath}`);
    await runTask(`git commit -m '${version}'`);
    return version;
}
