const runTask = async (str: string) => {
  const [cmd, ...args] = str.split(" ");
  const command = new Deno.Command(cmd, {
    args,
  });
  const { code, stdout, stderr } = await command.output();
  if (code === 0) {
    await Deno.stdout.write(stdout);
  } else {
    console.error(stderr);
  }
  return code;
};

const runTasks = async function (arr: string[]) {
  for (const str of arr) {
    console.log(`运行任务：${str}`);
    const code = await runTask(str);
    console.log(`任务结束：${str}`);
    if (code) {
      Deno.exit(code);
    }
  }
};

export { runTask, runTasks };
