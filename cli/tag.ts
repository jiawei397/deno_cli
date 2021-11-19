// deno install --allow-read --allow-write --allow-run -n deno_tag -f ./tag.ts
import { runTasks } from "../lib/task.ts";
import { isFileExist } from "../lib/utils.ts";
import { scriptsPath } from "./globals.ts";
import { changeVersion } from "./version_change.ts";

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
      const args = Deno.args;
      let newVersion = version;
      if (args.includes("-L") || args.includes("--local")) { // 代表是local本地，版本不允许有v
        if (version.startsWith("v")) {
          newVersion = version.substr(1);
        }
      } else { // 其余就添加v
        newVersion = version.startsWith("v") ? version : ("v" + version);
      }
      await tag(newVersion);
    } else {
      const version = Deno.args[0];
      if (version) {
        await tag(version);
      } else {
        console.error("需要传递version");
        Deno.exit(1);
      }
    }
  }
}
