#!/usr/bin/env node
import { main } from "./main.js";

process.exitCode = main(process.argv.slice(2), {
  stdout: process.stdout,
  stderr: process.stderr,
  isStdoutTTY: Boolean(process.stdout.isTTY),
  isStderrTTY: Boolean(process.stderr.isTTY),
  env: process.env,
});
