const runTask = async (str: string) => {
  const p = Deno.run({
    cmd: str.split(" "),
    stdout: "piped",
    stderr: "piped",
  });
  const { code } = await p.status();
  if (code === 0) {
    const rawOutput = await p.output();
    await Deno.stdout.write(rawOutput);
  } else {
    const rawError = await p.stderrOutput();
    const errorString = new TextDecoder().decode(rawError);
    console.log(errorString);
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
}

export { runTask, runTasks };
