// deno_tag patch -M 'feat: xxx'
// 这个文件专门处理deno的变更
import { runTasks } from "@/lib/task.ts";
import { isFileExist } from "@/lib/utils.ts";
import { parse as parseToml } from "std/toml/mod.ts";
import { applyEdits, modify, parse as parseJson } from "jsonc";
import { cargoLockPath, cargoPath, readmePath } from "../globals.ts";
import { Package, RustToml, VersionAction } from "./types.ts";
import { relative, resolve } from "std/path/mod.ts";
import { expandGlob } from "std/fs/mod.ts";

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
    console.warn(`package中没有找到name`);
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

export async function changeDenoVersion(
  action: VersionAction | string,
  options: {
    childDir: string;
    isDeep: boolean;
    denoJsonPath: string;
  },
) {
  const { denoJsonPath } = options;
  const pkg = await getPkgFromDenoJson(denoJsonPath);
  const version = formatVersion(pkg, action);
  await writeDenoJson(version, denoJsonPath!);

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
    `git add ${denoJsonPath} ${readmePaths}`,
    `git commit -m ${version}`,
  ];
  await runTasks(arr);

  return version;
}

async function writeRustToml(version: string, cargoPath: string) {
  const str = Deno.readTextFileSync(cargoPath);
  const result = str.replace(
    /version = "\d{1,3}\.\d{1,3}\.\d{1,3}"/,
    `version = "${version}"`,
  );
  await Deno.writeTextFile(cargoPath, result);
}

async function writeRustLock(
  version: string,
  name: string,
  cargoLockPath: string,
) {
  const str = Deno.readTextFileSync(cargoLockPath);
  const reg = new RegExp(`name = "${name}"\\nversion = "(\.*)"`);
  const result = str.replace(reg, `name = "${name}"\nversion = "${version}"`);
  await Deno.writeTextFile(cargoLockPath, result);
}

export async function changeRustVersion(
  action: VersionAction | string,
) {
  const str = Deno.readTextFileSync(cargoPath);
  const data = parseToml(str) as unknown as RustToml;
  const { name, version: oldVersion } = data.package;
  console.log(`读到工程名：${name} 与版本号：${oldVersion}`);
  const version = formatVersion(data.package, action);
  await writeRustToml(version, cargoPath);
  await writeRustLock(version, name, cargoLockPath);

  const arr = [
    `git add ${cargoPath} ${cargoLockPath}`,
    `git commit -m ${version}`,
  ];
  await runTasks(arr);

  return version;
}
