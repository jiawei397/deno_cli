// deno_tag patch 'feat: xxx'
// 这个文件专门处理deno的变更
import { runTasks } from "../lib/task.ts";
import { isFileExist } from "../lib/utils.ts";

// deno_tag patch
export const scriptsPath = "scripts.json";
const readmePath = 'README.md';
const actions = ["patch", "minor", "major"];

interface Package {
    version: string;
    name: string;
    [K: string]: any;
}

async function getPkg() {
    const pkg = await Deno.readTextFile(scriptsPath);
    const pkgMap: Package = JSON.parse(pkg);
    if (pkgMap.version) {
        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(pkgMap.version)) {
            console.error(
                `version [${pkgMap.version}] in [${scriptsPath}] is invalid`,
            );
            Deno.exit(1);
        }
    } else {
        pkgMap.version = "0.0.0";
    }
    return pkgMap;
}

function formatVersion(pkg: Package) {
    // console.log(Deno.args);
    const versionAction = Deno.args[0] || actions[0];
    let version = versionAction;

    if (actions.includes(versionAction)) { // 意味着要变更版本
        const oldversionAction = pkg.version;

        const arr = oldversionAction.split(".");
        let changedIndex = 0;
        if (versionAction === "patch") {
            changedIndex = 2;
        } else if (versionAction === "minor") {
            changedIndex = 1;
            arr[2] = "0";
        } else {
            arr[2] = arr[1] = "0";
        }
        if (changedIndex !== -1) {
            arr[changedIndex] = (Number(arr[changedIndex]) + 1) + "";
        }
        version = arr.join(".");
    }

    return version;
}

async function writeJson(version: string, pkg: Package) {
    const { version: _, ...others } = pkg;
    console.log(`version will be changed to ${version}`);
    await Deno.writeTextFile(
        scriptsPath,
        JSON.stringify(
            {
                version,
                ...others,
            },
            null,
            2,
        ),
    );
}


async function writeReadme(version: string, pkg: Package) {
    if (!isFileExist(readmePath)) {
        console.warn(`没有找到【${readmePath}】`)
        return;
    }

    if (!pkg.name) {
        console.warn(`【${scriptsPath}】中没有找到name`)
    }

    const doc = await Deno.readTextFile(readmePath);
    const reg = new RegExp(pkg.name + '@v(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})', 'g');
    const newDoc = doc.replace(reg, pkg.name + '@' + version);
    await Deno.writeTextFile(readmePath, newDoc);
}

export async function changeVersion() {
    const pkg = await getPkg();
    const version = formatVersion(pkg);
    await writeJson(version, pkg);
    await writeReadme(version, pkg);

    const arr = [
        `git add ${scriptsPath}`,
        `git commit -m ${version}`,
    ];
    await runTasks(arr);

    return version;
}

// changeVersion();