// deno compile --unstable --allow-write --allow-read --allow-net --import-map import_map.json --target x86_64-pc-windows-msvc cli/download.ts
// deno compile --unstable --allow-write --allow-read --allow-net --import-map import_map.json cli/download.ts
import { basename, extname } from "std/path/mod.ts";
import { download } from "@/lib/utils.ts";
import Ask from "ask";

// const ask = new Ask(); // global options are also supported! (see below)
const ask = new Ask({
  prefix: ">",
});

interface Params {
  url: string;
  name: string;
}

const answers = await ask.prompt([
  {
    name: "url",
    type: "input",
    message: "url:",
  },
  {
    name: "name",
    type: "input",
    message: "name:",
    prefix: "?",
  },
]);

const { url, name } = answers as unknown as Params;

const fileName = name ? (name + extname(url)) : basename(url);
await download(url, fileName);

console.log(`download ${url} ok`);
