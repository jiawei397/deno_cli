// deno install --allow-read --allow-write --allow-run --unstable -n tag -f ./cli/tag/mod.ts
import { runTasks } from "../../lib/task.ts";
import { isFileExist } from "../../lib/utils.ts";
import { cargoPath } from "../globals.ts";
import { changeDenoVersion, changeRustVersion } from "./version_change.ts";
import { parse } from "../../deps.ts";
import { TagParams, VersionAction } from "./types.ts";

async function getNodeVersion() {
  const pkg: string = await Deno.readTextFile("package.json");
  const { version } = JSON.parse(pkg);
  console.log(`读到版本号：${version}`);
  return version;
}

async function tagNode(params: TagParams) {
  const versionAction = params._.length ? params._[0] : VersionAction.patch;
  await runTasks([`npm version ${versionAction}`]);
  const version = await getNodeVersion();
  return tag(version, getMsg(params));
}

async function tag(version: string, msg?: string) {
  let cmd: string;
  if (msg) {
    cmd = `git tag -a ${version} -m "${msg}"`;
  } else {
    cmd = `git tag ${version}`;
  }
  const arr = [
    cmd,
    `git push origin ${version}`,
  ];
  await runTasks(arr);
}

function getMsg(params: TagParams): string | undefined {
  return params.msg || params.M;
}

async function tagDeno(params: TagParams) {
  let denoJsonPath = "";
  if (isFileExist("deno.jsonc")) {
    denoJsonPath = "deno.jsonc";
  } else if (isFileExist("deno.json")) {
    denoJsonPath = "deno.json";
  }
  if (!denoJsonPath) { // 这几个文件都没有
    const version = params.version || params.V;
    if (version) {
      await tag(version, getMsg(params));
    } else {
      throw new Error("需要传递--version或-V参数");
    }
    return;
  }
  const action = params.version || params.V ||
    (params._.length > 0 ? params._[0] : VersionAction.patch);
  const version = await changeDenoVersion(action, {
    isDeep: params.deep || params.D,
    childDir: params.path || params.P,
    denoJsonPath,
  });
  const msg = getMsg(params);
  const isStartsWithV = !(params.local || params.L); // 版本号开头要不要加v，默认是带的
  let newVersion = version;
  if (!isStartsWithV) { // 代表是local本地，版本不允许有v
    if (version.startsWith("v")) {
      newVersion = version.substring(1);
    }
  } else { // 其余就添加v
    newVersion = version.startsWith("v") ? version : ("v" + version);
  }
  await tag(newVersion, msg);
}

async function tagRust(params: TagParams) {
  const action = params.version || params.V ||
    (params._.length > 0 ? params._[0] : VersionAction.patch);
  const version = await changeRustVersion(action);
  const msg = getMsg(params);
  await tag(version, msg);
}

if (import.meta.main) {
  const params = parse(Deno.args) as TagParams;
  if (isFileExist("package.json")) {
    tagNode(params);
  } else if (isFileExist(cargoPath)) {
    tagRust(params);
  } else {
    tagDeno(params);
  }
}
