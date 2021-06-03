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

export {runTask};
