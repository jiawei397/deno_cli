export function isFileExist(path: string) {
  try {
    Deno.statSync(path);
    return true;
  } catch {
    return false;
  }
}

export async function download(url: string, fileName: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/zip",
    },
  });
  const buffer = await response.arrayBuffer();
  return await Deno.writeFile(fileName, new Uint8Array(buffer));
}
