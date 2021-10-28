// deno_tag patch 'feat: xxx'
// 这个文件专门处理deno的变更
import { runTasks } from "../lib/task.ts";
import { isFileExist } from "../lib/utils.ts";
import { YamlLoader } from "../deps.ts";

// deno_tag patch
export const scriptsPath = "scripts.yml";
const readmePath = "README.md";
const actions = ["patch", "minor", "major"];

interface Package {
  version: string;
  name: string;

  [K: string]: unknown;
}

async function getPkg() {
  const yaml = new YamlLoader();

  const pkgMap = await yaml.parseFile(scriptsPath) as Package;

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
  let first = Deno.args[0];
  if (first === "-L" || first === "--local") {
    first = "";
  }
  const versionAction = first || actions[0];
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
  } else {
    if (version.startsWith("v")) {
      version = version.substr(1);
    }
  }

  return version;
}

async function writeScripts(version: string) {
  console.log(`【${scriptsPath}】version will be changed to ${version}`);
  const str = await Deno.readTextFile(scriptsPath);
  const reg = /version:\s*\d+\.\d+\.\d+/g;
  let newStr: string;
  if (reg.test(str)) {
    newStr = str.replace(reg, "version: " + version);
  } else {
    newStr = "version: " + version + "\n" + str;
  }
  await Deno.writeTextFile(scriptsPath, newStr);
}

async function writeReadme(version: string, pkg: Package) {
  if (!isFileExist(readmePath)) {
    console.warn(`没有找到【${readmePath}】`);
    return;
  }

  if (!pkg.name) {
    console.warn(`【${scriptsPath}】中没有找到name`);
  }

  const doc = await Deno.readTextFile(readmePath);
  const reg = new RegExp(pkg.name + "@v(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})", "g");
  const newDoc = doc.replace(reg, pkg.name + "@v" + version);
  await Deno.writeTextFile(readmePath, newDoc);
}

export async function changeVersion() {
  const pkg = await getPkg();
  const version = formatVersion(pkg);
  await writeScripts(version);
  await writeReadme(version, pkg);

  const arr = [
    `git add ${scriptsPath} ${readmePath}`,
    `git commit -m ${version}`,
  ];
  await runTasks(arr);

  return version;
}

// changeVersion();
