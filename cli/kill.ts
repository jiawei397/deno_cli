// deno install --allow-run -n dk -f ./cli/kill.ts
const port = Deno.args[0] || 9229;
if (isNaN(Number(port))) {
  console.log("端口号必须是数字");
  Deno.exit(1);
}
const command = new Deno.Command("lsof", {
  args: ["-i", `:${port}`, "-P", "-t"],
});
const { stdout } = await command.output();

const pid = new TextDecoder().decode(stdout).trim();

if (pid) {
  const killProcess = new Deno.Command("kill", {
    args: ["-9", pid],
  });

  await killProcess.output();

  console.log(`已成功清除端口 ${port} 上的进程`);
} else {
  console.log(`端口 ${port} 上没有进程占用`);
}
