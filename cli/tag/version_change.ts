// deno_tag patch -M 'feat: xxx'
// 这个文件专门处理deno的变更
import { runTasks } from "../../lib/task.ts";
import { isFileExist } from "../../lib/utils.ts";
import {
  applyEdits,
  expandGlob,
  modify,
  parseJson,
  relative,
  resolve,
  YamlLoader,
} from "../../deps.ts";
import { readmePath, scriptsPath } from "../globals.ts";
import { Package, VersionAction } from "./types.ts";

async function getPkgFromScripts() {
  const yaml = new YamlLoader();
  return await yaml.parseFile(scriptsPath) as Package;
}

async function getPkgFromDenoJson(denoJsonPath: string): Promise<Package> {
  const text = await Deno.readTextFile(denoJsonPath);
  return parseJson(text);
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

function checkVersion(version: string) {
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(version)) {
    throw new Error(`version [${version}] is invalid`);
  }
}

function getOldVersion(pkg: Package) {
  return pkg.version || "0.0.0";
}

function formatVersion(pkg: Package, versionAction: VersionAction | string) {
  let version = versionAction;
  const actions: string[] = Object.values(VersionAction);
  if (actions.includes(versionAction)) { // 意味着要变更版本
    const oldVersion = getOldVersion(pkg);
    checkVersion(oldVersion);
    version = getNewVersion(versionAction as VersionAction, oldVersion);
  } else {
    if (version.startsWith("v")) {
      version = version.substring(1);
    }
    checkVersion(version);
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

async function writeDenoJson(version: string, denoJsonPath: string) {
  console.log(`【${denoJsonPath}】version will be changed to ${version}`);
  const text = await Deno.readTextFile(denoJsonPath);
  const modifyVersion = modify(text, ["version"], version, {});
  const result = applyEdits(text, modifyVersion);
  await Deno.writeTextFile(denoJsonPath, result);
}

async function writeReadme(version: string, pkg: Package, path: string) {
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

async function findAllReadme(childDir = "") {
  const paths = [];
  for await (
    const file of expandGlob(resolve(childDir, "**/*.md"))
  ) {
    if (/readme.*.md/i.test(file.name)) {
      paths.push(relative(Deno.cwd(), file.path));
    }
  }

  return paths;
}

export async function changeVersion(
  action: VersionAction | string,
  options: {
    childDir: string;
    isDeep: boolean;
    denoJsonPath?: string;
  },
) {
  let isFromDenoJson = false;
  let pkg: Package | undefined;
  const { denoJsonPath } = options;
  if (denoJsonPath) {
    pkg = await getPkgFromDenoJson(denoJsonPath);
  }
  if (!pkg || !pkg.version) { // 优先读取deno.json中version，没找到再去scripts中读取，将来考虑去掉scripts.yml
    pkg = await getPkgFromScripts();
  } else {
    isFromDenoJson = true;
  }
  const version = formatVersion(pkg, action);
  if (isFromDenoJson) {
    await writeDenoJson(version, denoJsonPath!);
  } else {
    await writeScripts(version);
  }

  let readmePaths: string = readmePath;
  if (options.isDeep) {
    const paths = await findAllReadme(options.childDir);
    await Promise.all(paths.map((readmePath) => {
      return writeReadme(version, pkg!, readmePath);
    }));
    readmePaths = paths.join(" ");
  } else {
    await writeReadme(version, pkg, readmePath);
  }

  const arr = [
    `git add ${isFromDenoJson ? denoJsonPath : scriptsPath} ${readmePaths}`,
    `git commit -m ${version}`,
  ];
  await runTasks(arr);

  return version;
}
