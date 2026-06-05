import { spawn } from "node:child_process";
import "./load-env.mjs";

const commands = [
  { name: "api", command: "node", args: ["server/api-server.mjs"] },
  { name: "preview", command: "node", args: ["server/local-preview.mjs"] }
];

const children = commands.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    stdio: "pipe",
    shell: false,
    env: process.env
  });

  child.stdout.on("data", (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[${name}] ${data}`));
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
});

function shutdown() {
  for (const child of children) child.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
