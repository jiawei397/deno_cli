// deno install --allow-run --allow-net --allow-read --allow-write --allow-env --unstable --import-map import_map.json -n gum  -f ./cli/git/user_change.ts
import { runTask, runTasks } from "@/lib/task.ts";
import { Input } from "cliffy/prompt/mod.ts";
import { Command } from "cliffy/command/mod.ts";
import { Row, Table } from "cliffy/table/mod.ts";
import { colors } from "cliffy/ansi/colors.ts";
import pkg from "@/deno.json" with { type: "json" };
import {
  DenoLandProvider,
  UpgradeCommand,
} from "cliffy/command/upgrade/mod.ts";
import os from "node:os";
import { join } from "std/path/mod.ts";
import { ensureFile } from "std/fs/ensure_file.ts";

const PREFIX = "git_user";
const kvPath = join(os.homedir(), ".deno", "kv", PREFIX);
await ensureFile(kvPath); // 如果不存在则创建

const info = colors.bold.blue;
const error = colors.bold.red;

interface GitUser {
  username: string;
  email: string;
  alias: string; // 用作key值
}
const kv = await Deno.openKv(kvPath); // 指定路径后，版本升级数据也不会丢失

async function getUserList(): Promise<GitUser[]> {
  const entries = kv.list<GitUser>({ prefix: [PREFIX] });
  const users: GitUser[] = [];
  for await (const entry of entries) {
    users.push(entry.value);
  }
  return users;
}

async function addUser(user: GitUser) {
  await kv.set([PREFIX, user.alias], user);
}

async function getUser(alias: string): Promise<GitUser | null> {
  const entry = await kv.get<GitUser>([PREFIX, alias]);
  if (entry) {
    return entry.value;
  }
  return null;
}

async function removeUser(alias: string) {
  await kv.delete([PREFIX, alias]);
}

async function getCurrentUser(): Promise<GitUser | undefined> {
  const username = await runTask("git config user.name");
  const allUsers = await getUserList();
  return allUsers.find((user) => user.username === username.trim());
}

async function showGitList() {
  const users = await getUserList();
  const currentUser = await getCurrentUser();
  const rows = users.map((user) => {
    const isCurrent = currentUser?.alias === user.alias;
    return new Row(
      user.alias,
      user.username,
      user.email,
      isCurrent ? "✓" : "",
    ).border();
  });
  new Table()
    .header(Row.from(["Alias", "UserName", "Email", "Current"]).border())
    .body(rows)
    .render();
}

async function changeGitUser(username: string, email: string) {
  await runTasks([
    `git config user.name ${username}`,
    `git config user.email ${email}`,
  ]);
}

if (import.meta.main) {
  const list = new Command()
    .description("List all git users.")
    .action(showGitList);
  const add = new Command()
    .description("Add one git user.")
    .action(async () => {
      const name: string = await Input.prompt({
        message: `Set a username`,
      });
      const email: string = await Input.prompt({
        message: `Set a email`,
      });

      const alias: string = await Input.prompt({
        message: `Set an alias`,
        default: name,
      });
      const user: GitUser = {
        username: name,
        email,
        alias,
      };
      await addUser(user);

      console.log(info("Git user added"));
      await showGitList();
    });

  const use = new Command()
    .description("Change current git user.")
    .arguments("<alias:string>")
    .action(async (_options: unknown, alias: string) => {
      const user = await getUser(alias);
      if (!user) {
        console.log(error(`Not find user by alias: ${alias}`));
        return;
      }
      console.log(`${user.alias} ------ ${user.username} ---- ${user.email}`);
      await changeGitUser(user.username, user.email);
      console.log(info("Git user changed"));
      await showGitList();
    });

  const del = new Command()
    .description("Remove one git user.")
    .arguments("<alias:string>")
    .action(async (_options: unknown, alias: string) => {
      const user = await getUser(alias);
      if (!user) {
        console.log(error(`Not find user by alias: ${alias}`));
        return;
      }
      const currentUser = await getCurrentUser();
      if (currentUser?.alias === alias) {
        console.log(error(`Can't remove current git user`));
        return;
      }
      console.log(`${user.alias} ------ ${user.username} ---- ${user.email}`);
      await removeUser(alias);
      console.log(info("Git user has been removed"));
      await showGitList();
    });

  const upgrade = new UpgradeCommand({
    main: "cli/git/user_change.ts",
    args: [
      "--allow-net",
      "--allow-run",
      "--allow-env",
      "--allow-write",
      "--allow-read",
      "--unstable",
    ],
    provider: new DenoLandProvider({ name: "jw_cli" }),
  });

  await new Command()
    .name("gum")
    .version("v" + pkg.version)
    .description("Change the git user in current project")
    .meta("deno", Deno.version.deno)
    .meta("v8", Deno.version.v8)
    .meta("typescript", Deno.version.typescript)
    .default("list")
    .command("list ls", list)
    .command("add", add)
    .command("delete del remove", del)
    .command("use", use)
    .command("upgrade", upgrade)
    .parse(Deno.args);
}
