// deno install --allow-run --import-map import_map.json -n push -f ./cli/git/push.ts
import { runTasks } from "@/lib/task.ts";
if (import.meta.main) {
  await runTasks(["git push -o ci.skip"]);
}
