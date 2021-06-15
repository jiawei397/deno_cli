// deno install --allow-net --allow-read --allow-run -n deno_tag -f ./tag.ts
import { runTask } from '../lib/task.ts';

const tag = async function (version: string) {
  const arr = [
    `git tag -a ${version} -m "${version}"`,
    `git push origin ${version}`,
  ];
  for (var str of arr) {
    console.log(`运行任务：${str}`);
    const code = await runTask(str);
    console.log(`任务结束：${str}`);
    if (code) {
      Deno.exit(code);
    }
  }
};

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

if (import.meta.main) {
  if (Deno.args.length > 0) {
    let version = Deno.args[0];
    if (!version.startsWith('v')) {
      version = 'v' + version;
    }
    tag(version);
  } else {
    tagNode();
  }
}
