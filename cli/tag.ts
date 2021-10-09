// deno install --allow-read --allow-write --allow-run -n deno_tag -f ./tag.ts
import { runTasks } from "../lib/task.ts";
import { isFileExist } from "../lib/utils.ts";
import { changeVersion, scriptsPath } from "./version_change.ts";

let msg: string;

function tagNode() {
  const pkg: string = Deno.readTextFileSync(Deno.cwd() + "/package.json");
  if (!pkg) {
    console.error(`当前目录下没有package.json`);
    return;
  }
  const { version } = JSON.parse(pkg);
  console.log(`读到版本号：${version}`);
  return tag(version);
}

async function tag(version: string) {
  const arr = [
    `git tag -a ${version} -m "${msg || version}"`,
    `git push origin ${version}`,
  ];
  await runTasks(arr);
}


if (import.meta.main) {
  const isExistPkg = isFileExist("package.json");
  if (isExistPkg) {
    tagNode();
  } else {
    const isExistScripts = isFileExist(scriptsPath);
    if (isExistScripts) {
      const version = await changeVersion();
      msg = Deno.args[1] || version;
      const newVersion = version.startsWith("v") ? version : ("v" + version);
      tag(newVersion);
    } else {
      const version = Deno.args[0];
      if (version) {
        tag(version);
      } else {
        console.error("需要传递version");
        Deno.exit(1);
      }
    }
  }
}
