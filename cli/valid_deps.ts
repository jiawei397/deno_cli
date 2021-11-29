import { isFileExist } from "../lib/utils.ts";
// deno install  --allow-read --allow-env -n deno_valid -f ./cli/valid_deps.ts
/**
 * 校验文件内容中是否都包含版本号
 */
export function validIfHasUnversioned(str: string) {
  const arr = str.split(`;`);
  const versionReg = /@[v]?\d{1,3}\.\d{1,3}\.\d{1,3}\//;
  return !arr.some((item) => {
    if (!item.includes("from")) {
      return;
    }
    if (!versionReg.test(item)) {
      if (Deno.env.get("DEBUG")) {
        console.debug(item);
      }
      return true;
    }
  });
}

// const result = validIfHasUnversioned(str);
// console.log(result);

if (import.meta.main) {
  const depsPath = Deno.args[0] || "deps.ts";
  const isExistDeps = isFileExist(depsPath);
  if (!isExistDeps) {
    console.error(`未找到文件：${depsPath}`);
    Deno.exit(1);
  }
  const str = Deno.readTextFileSync(depsPath);
  const isValid = validIfHasUnversioned(str);
  if (!isValid) {
    console.error(`【${depsPath}】中有未带版本号的引用`);
    Deno.exit(1);
  }
  console.info("end");
}
