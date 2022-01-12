// deno install --allow-read --allow-write --allow-run --unstable -n deno_tag -f ./tag.ts
import { runTasks } from "../../lib/task.ts";
import { isFileExist } from "../../lib/utils.ts";
import { scriptsPath } from "../globals.ts";
import { changeVersion } from "./version_change.ts";
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
  return tag(version, getMsg(params, version));
}

async function tag(version: string, msg: string) {
  const arr = [
    `git tag -a ${version} -m "${msg}"`,
    `git push origin ${version}`,
  ];
  await runTasks(arr);
}

function getMsg(params: TagParams, version: string) {
  return params.msg || params.M || version;
}

async function tagDeno(params: TagParams) {
  const isExistScripts = isFileExist(scriptsPath);
  if (isExistScripts) {
    const action = params.version || params.V ||
      (params._.length > 0 ? params._[0] : VersionAction.patch);
    const version = await changeVersion(action, {
      isDeep: params.deep || params.D,
      childDir: params.path || params.P,
    });
    const msg = getMsg(params, version);
    const isStartsWithV = !(params.local || params.L); // 版本号开头要不要加v，默认是带的
    let newVersion = version;
    if (!isStartsWithV) { // 代表是local本地，版本不允许有v
      if (version.startsWith("v")) {
        newVersion = version.substr(1);
      }
    } else { // 其余就添加v
      newVersion = version.startsWith("v") ? version : ("v" + version);
    }
    await tag(newVersion, msg);
  } else {
    const version = params.version || params.V;
    if (version) {
      await tag(version, getMsg(params, version));
    } else {
      console.error("需要传递--version或-V参数");
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  const isExistPkg = isFileExist("package.json");
  const params = parse(Deno.args) as TagParams;
  if (isExistPkg) {
    tagNode(params);
  } else {
    tagDeno(params);
  }
}
