import os from "node:os";
import { syncBuiltinESMExports } from "node:module";

try {
  os.userInfo();
} catch {
  // tsx uses the current username only to name its temporary IPC directory.
  // Some managed Windows shells cannot resolve the OS account through libuv.
  const username = process.env.USERNAME || process.env.USER || "legend-motors-test";
  os.userInfo = () => ({ username, uid: -1, gid: -1, shell: null, homedir: os.homedir() });
  syncBuiltinESMExports();
}
