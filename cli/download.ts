// deno compile --unstable --allow-write --allow-read --allow-net --target x86_64-pc-windows-msvc cli/download.ts
// deno compile --unstable --allow-write --allow-read --allow-net cli/download.ts
import { Ask, basename, extname } from "../deps.ts";
import { download } from "../lib/utils.ts";
// const ask = new Ask(); // global options are also supported! (see below)
const ask = new Ask({
  prefix: ">",
});

interface Params {
  url: string;
  name: string;
}

const answers: any = await ask.prompt([
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

const { url, name } = answers as Params;

const fileName = name ? (name + extname(url)) : basename(url);
await download(url, fileName);
