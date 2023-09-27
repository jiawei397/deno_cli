// deno compile --unstable --allow-write --allow-read --allow-net --target x86_64-pc-windows-msvc cli/project.ts
// deno compile --unstable --allow-write --allow-read --allow-net cli/project.ts
import Ask from "ask";
import { applyEdits, modify, parse as parseJson } from "jsonc";
import { download } from "../lib/utils.ts";
import { readmePath } from "./globals.ts";
import { decompress } from "zip";
import { join } from "std/path/mod.ts";

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

function modifyAndFormat(text: string, key: string, value: string): string {
  const modifyVersion = modify(text, [key], value, {
    formattingOptions: {
      insertSpaces: true,
      tabSize: 2,
    },
  });
  return applyEdits(
    text,
    modifyVersion,
  );
}

function modifyText(text: string, map: Record<string, string>) {
  return Object.keys(map).reduce((acc, key) => {
    return modifyAndFormat(acc, key, map[key]);
  }, text);
}

async function writeDenoJson(name: string, denoJsonPath: string) {
  console.log(`【${denoJsonPath} will be changed`);
  const realPath = join(name, denoJsonPath);
  let text = await Deno.readTextFile(realPath);
  text = text.replace(templateName, name);
  const pkg: { version: string } = parseJson(text);
  const result = modifyText(text, {
    name,
    "version": "1.0.0",
    "template_version": pkg.version,
  });
  await Deno.writeTextFile(realPath, result);
}

async function writeReadme(name: string) {
  const realPath = join(name, readmePath);
  const doc = await Deno.readTextFile(realPath).catch((_) => null);
  if (!doc) {
    console.warn(`没有找到【${realPath}】`);
    return;
  }
  const newDoc = doc.replaceAll(templateName, name);
  await Deno.writeTextFile(realPath, newDoc);
}

async function main() {
  let name = Deno.args[0];
  if (!name) {
    // deno-lint-ignore no-explicit-any
    const answers: any = await ask.prompt([
      {
        name: "name",
        type: "input",
        message: "projectName:",
      },
    ]);
    name = (answers as Params).name;
  }

  await download(url, zipName);
  await decompress(zipName, "./");
  await Deno.rename(projectName + "-" + branchName, name);
  await Deno.remove(zipName);

  await writeReadme(name);
  await writeDenoJson(name, "deno.jsonc");

  console.log(`init project ${projectName} end`);
}

main();
