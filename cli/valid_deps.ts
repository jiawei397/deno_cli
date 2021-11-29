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
