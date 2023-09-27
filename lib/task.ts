export async function runTask(str: string): Promise<string> {
  const [cmd, ...args] = str.split(" ");
  const command = new Deno.Command(cmd, {
    args,
  });
  const { code, stdout, stderr } = await command.output();
  const te = new TextDecoder();
  if (code !== 0) {
    throw new Error(te.decode(stderr));
  }
  return te.decode(stdout);
}

export const runTasks = async function (arr: string[], isShowLog = true) {
  for (const str of arr) {
    if (isShowLog) {
      console.log(`运行任务：${str}`);
    }
    const msg = await runTask(str);
    if (isShowLog) {
      if (msg) {
        console.log(msg);
      }
      console.log(`任务结束：${str}`);
    }
  }
};
