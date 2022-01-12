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
}

export interface Package {
  version: string;
  name: string;

  [K: string]: unknown;
}
