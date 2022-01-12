// deno_tag patch -M 'feat: xxx'
// 这个文件专门处理deno的变更
import { runTasks } from "../../lib/task.ts";
import { isFileExist } from "../../lib/utils.ts";
import { YamlLoader } from "../../deps.ts";
import { readmePath, scriptsPath } from "../globals.ts";
import { Package, VersionAction } from "./types.ts";

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

/**
 * 获取新的版本号
 * @param versionAction
 * @param oldversionAction 例：1.0.1
 * @returns
 */
function getNewVersion(versionAction: VersionAction, oldversionAction: string) {
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
  return arr.join(".");
}

function formatVersion(pkg: Package, versionAction: VersionAction | string) {
  let version = versionAction;
  const actions: string[] = Object.values(VersionAction);
  if (actions.includes(versionAction)) { // 意味着要变更版本
    version = getNewVersion(versionAction as VersionAction, pkg.version);
  } else {
    if (version.startsWith("v")) {
      version = version.substring(1);
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

async function writeReadme(version: string, pkg: Package, path = readmePath) {
  if (!isFileExist(path)) {
    console.warn(`没有找到【${path}】`);
    return;
  }

  if (!pkg.name) {
    console.warn(`【${scriptsPath}】中没有找到name`);
    return;
  }

  const doc = await Deno.readTextFile(path);
  const reg = new RegExp(pkg.name + "@v(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})", "g");
  const newDoc = doc.replace(reg, pkg.name + "@v" + version);
  await Deno.writeTextFile(path, newDoc);
}

export async function changeVersion(action: VersionAction | string) {
  const pkg = await getPkg();
  const version = formatVersion(pkg, action);
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
