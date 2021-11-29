import { assert, describe, it } from "../test_deps.ts";
import { validIfHasUnversioned } from "./valid_deps.ts";

describe("valid", () => {
  // beforeEach(() => {
  // });

  it("valid true", () => {
    const str =
      `export { Bson } from "https://deno.land/x/mongo@v0.28.0/mod.ts";
      export { Bson } from "https://deno.land/x/mongo@0.28.0/mod.ts";
      import { Bson } from "https://deno.land/x/mongo@v0.28.0/mod.ts";
      export { Bson}
    `;
    assert(
      validIfHasUnversioned(str),
      "may be true",
    );
  });

  describe("valid false", () => {
    it("version must be three", () => {
      const str =
        `export { WireProtocol } from "https://deno.land/x/mongo@v0.28/src/protocol/mod.ts";`;
      assert(!validIfHasUnversioned(str));
    });

    it("version must be number", () => {
      const str =
        `export { WireProtocol } from "https://deno.land/x/mongo@v0.28.1aa/src/protocol/mod.ts";`;
      assert(!validIfHasUnversioned(str));
    });
  });
});
