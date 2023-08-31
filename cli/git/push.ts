// deno install --allow-run -n push -f ./push.ts
import { runTasks } from "../../lib/task.ts";
if (import.meta.main) {
    await runTasks(["git push -o ci.skip"]);
}
