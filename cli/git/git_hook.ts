await Deno.writeTextFile(
  "./.git/hooks/pre-commit",
  `#!/bin/sh
# deno

if ! command -v deno >/dev/null 2>&1; then
  echo "Can't find deno in PATH, trying to find a deno binary on your system"
fi

deno lint`,
);

console.info("Installed deno-lint hook");
