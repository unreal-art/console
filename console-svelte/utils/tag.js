import { exec, execSync } from "child_process";
import { promisify } from "node:util";

export let tag = execSync("git describe --tags || git rev-parse --short HEAD").toString().trim();

console.log({ tag });

// import { exec } from 'child_process'
// import { promisify } from 'util'

// // Get current tag/commit and last commit date from git
// const pexec = promisify(exec)
// let [version, lastmod] = (
//   await Promise.allSettled([
//     pexec('git describe --tags || git rev-parse --short HEAD'),
//     pexec('git log -1 --format=%cd --date=format:"%Y-%m-%d %H:%M"'),
//   ])
// ).map(v => JSON.stringify(v.value?.stdout.trim()))
