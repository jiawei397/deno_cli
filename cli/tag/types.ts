export enum VersionAction {
  patch = "patch",
  minor = "minor",
  major = "major",
}

export interface TagParams {
  _: VersionAction[];
  L: boolean;
  local: boolean; // 版本号不加前缀v
  version: string;
  V: string;
  msg: string;
  M: string;
  path: string;
  P: string; // 查找readme.md的目录

  deep: boolean;
  D: boolean; // 是否递归查找readme.md
}

export interface Package {
  version: string;
  name: string;

  [K: string]: unknown;
}

export interface RustToml {
  package: Package;
}
