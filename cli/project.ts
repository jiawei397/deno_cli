// deno compile --unstable --allow-write --allow-read --allow-net --target x86_64-pc-windows-msvc cli/project.ts
// deno compile --unstable --allow-write --allow-read --allow-net cli/project.ts
import { Ask, decompress, join } from "../deps.ts";
import { download, isFileExist } from "../lib/utils.ts";
import { readmePath, scriptsPath } from "./globals.ts";

const ask = new Ask({
  prefix: ">",
});

interface Params {
  name: string;
}

const projectName = "deno_template";
const branchName = "master";
const url =
  `https://github.com/jiawei397/${projectName}/archive/refs/heads/${branchName}.zip`;
const zipName = projectName + ".zip";
const templateName = projectName;

async function writeScripts(name: string) {
  console.log(`【${scriptsPath}】 will be changed`);
  const realPath = join(name, scriptsPath);
  const str = await Deno.readTextFile(realPath);
  const reg = /version:\s+/g;
  let newStr = str;
  if (reg.test(str)) {
    newStr = str.replace(reg, "template_version: ");
  }
  newStr = "version: 1.0.0" + "\n" + newStr;
  const nameReg = new RegExp(`name: ${templateName}`);
  newStr = newStr.replace(nameReg, `name: ${name}`);
  await Deno.writeTextFile(realPath, newStr);
}

async function writeReadme(name: string) {
  const realPath = join(name, readmePath);
  if (!isFileExist(realPath)) {
    console.warn(`没有找到【${realPath}】`);
    return;
  }
  const doc = await Deno.readTextFile(realPath);
  const nameReg = new RegExp(templateName, "g");
  const newDoc = doc.replace(nameReg, name);
  await Deno.writeTextFile(realPath, newDoc);
}

async function main() {
  const answers: any = await ask.prompt([
    {
      name: "name",
      type: "input",
      message: "projectName:",
    },
  ]);

  const { name } = answers as Params;

  await download(url, zipName);
  await decompress(zipName, "./");
  await Deno.rename(projectName + "-" + branchName, name);
  await Deno.remove(zipName);

  await writeReadme(name);
  await writeScripts(name);

  console.log(`init project ${projectName} end`);
}

main();
