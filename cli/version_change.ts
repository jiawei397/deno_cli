// deno_tag patch 'feat: xxx'
// 这个文件专门处理deno的变更
import { runTasks } from "../lib/task.ts";

// deno_tag patch
export const versionPath = "scripts.json";
const actions = ["patch", "minor", "major"];

interface Package {
    version: string;
    [K: string]: any;
}

async function getPkg() {
    const pkg = await Deno.readTextFile(versionPath);
    const pkgMap: Package = JSON.parse(pkg);
    if (pkgMap.version) {
        if (!/^\d{1}\.\d{1}\.\d{1}$/.test(pkgMap.version)) {
            console.error(
                `version [${pkgMap.version}] in [${versionPath}] is invalid`,
            );
            Deno.exit(1);
        }
    } else {
        pkgMap.version = "0.0.0";
    }
    return pkgMap;
}

function formatVersion(pkg: Package) {
    console.log(Deno.args);
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

function writeJson(version: string, pkg: Package) {
    const { version: _, ...others } = pkg;
    console.log(`version will be changed to ${version}`);
    Deno.writeTextFileSync(
        versionPath,
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

export async function changeVersion() {
    const pkg = await getPkg();
    const version = formatVersion(pkg);
    writeJson(version, pkg);

    const arr = [
        `git add ${versionPath}`,
        `git commit -m '${version}'`,
    ];
    await runTasks(arr);

    return version;
}
