// deno compile --unstable --allow-write --allow-read --target x86_64-pc-windows-msvc  ask.ts
// deno compile --unstable --allow-write --allow-read ask.ts
import Ask from "https://deno.land/x/ask@1.0.6/mod.ts";
import { extname } from "https://deno.land/std@0.115.1/path/mod.ts";
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

await download(url, name + extname(url));
