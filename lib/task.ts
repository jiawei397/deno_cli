export const runTask = async (str: string, isShowLog = true) => {
  const [cmd, ...args] = str.split(" ");
  const command = new Deno.Command(cmd, {
    args,
  });
  const { code, stdout, stderr } = await command.output();
  if (code === 0) {
    if (isShowLog) {
      await Deno.stdout.write(stdout);
    }
  } else {
    console.error(stderr);
  }
  return { code, stdout, stderr };
};

export const runTasks = async function (arr: string[], isShowLog = true) {
  for (const str of arr) {
    if (isShowLog) {
      console.log(`运行任务：${str}`);
    }
    const { code } = await runTask(str);
    if (isShowLog) {
      console.log(`任务结束：${str}`);
    }
    if (code) {
      Deno.exit(code);
    }
  }
};
