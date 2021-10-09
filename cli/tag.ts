// deno install --allow-net --allow-read --allow-run -n deno_tag -f ./tag.ts
import { runTask } from "../lib/task.ts";
import { changeVersion, versionPath } from "./version_change.ts";

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
  for (const str of arr) {
    console.log(`运行任务：${str}`);
    const code = await runTask(str);
    console.log(`任务结束：${str}`);
    if (code) {
      Deno.exit(code);
    }
  }
}


if (import.meta.main) {
  const isFileExist = function (path: string) {
    try {
      Deno.statSync(path);
      return true;
    } catch {
      return false;
    }
  };
  const isExistPkg = isFileExist("package.json");
  if (isExistPkg) {
    tagNode();
  } else {
    const isExistScripts = isFileExist(versionPath);
    if (isExistScripts) {
      const version = await changeVersion();
      msg = Deno.args[2] || version;
      const newVersion = version.startsWith("v") ? version : ("v" + version);
      tag(newVersion);
    } else {
      const version = Deno.args[1];
      if (version) {
        tag(version);
      } else {
        console.error("需要传递version");
        Deno.exit(1);
      }
    }
  }
}
